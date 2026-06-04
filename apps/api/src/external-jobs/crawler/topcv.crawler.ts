// DISCLAIMER: For academic research (graduation thesis) only.
// Respects robots.txt. Rate-limited. Not for commercial use.
import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { BOT_USER_AGENT, RawJob, sleep } from "./crawler.types";
import { normalizeTopCvJobUrl } from "./job-url.util";

const BASE_URL = "https://www.topcv.vn";
const MAX_PAGES = 3;
const REQUEST_DELAY_MS = 2000;

const CARD_SELECTORS = [".job-item", ".job-item-search-result", ".job-item-default", "[class*='job-item']"];
const TITLE_LINK_SELECTORS = [
  "h3.title a",
  ".title a",
  "a.job-title",
  "a[href*='/viec-lam/']"
];

/**
 * TopCV HTML scraper. TopCV markup changes over time, so the parser is
 * defensive: any card that cannot be mapped to a {title, url} pair is skipped
 * rather than throwing, and a failed page never aborts the whole crawl.
 */
@Injectable()
export class TopCvCrawler {
  private readonly logger = new Logger(TopCvCrawler.name);

  async crawl(keyword: string): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const seenUrls = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const url = `${BASE_URL}/tim-viec-lam-${encodeURIComponent(keyword)}-trang-${page}.html`;
      try {
        const { data } = await axios.get<string>(url, {
          headers: { "User-Agent": BOT_USER_AGENT, "Accept-Language": "vi,en;q=0.8" },
          timeout: 15_000,
          responseType: "text"
        });
        const parsed = this.parsePage(data, keyword, seenUrls);
        if (parsed.length === 0) {
          break;
        }
        jobs.push(...parsed);
      } catch (error) {
        this.logger.warn(`TopCV page ${page} for "${keyword}" failed: ${this.message(error)}`);
        break;
      }

      await sleep(REQUEST_DELAY_MS);
    }

    return jobs;
  }

  private parsePage(html: string, keyword: string, seenUrls: Set<string>): RawJob[] {
    const $ = cheerio.load(html);
    const results: RawJob[] = [];
    let matchedCards = false;

    for (const cardSelector of CARD_SELECTORS) {
      $(cardSelector).each((_, element) => {
        matchedCards = true;
        const job = this.parseCard($, $(element), keyword, seenUrls);
        if (job) results.push(job);
      });
      if (results.length > 0) break;
    }

    if (!matchedCards || results.length === 0) {
      $("a[href*='/viec-lam/']").each((_, element) => {
        const job = this.parseLinkFallback($, $(element), keyword, seenUrls);
        if (job) results.push(job);
      });
    }

    return results;
  }

  private parseCard(
    $: CheerioAPI,
    card: ReturnType<CheerioAPI>,
    keyword: string,
    seenUrls: Set<string>
  ): RawJob | null {
    const titleEl = card.find("h3.title a, .title a, a.job-title").first();
    let title = titleEl.text().trim();
    let detailUrl = this.resolveDetailUrl(card);

    if (!title) {
      const link = card.find("a[href*='/viec-lam/']").first();
      title = link.text().trim();
      detailUrl = detailUrl ?? normalizeTopCvJobUrl(link.attr("href"));
    }

    if (!title || !detailUrl || seenUrls.has(detailUrl)) return null;
    seenUrls.add(detailUrl);

    const company = card.find(".company .company-name, .company-name").first().text().trim() || "TopCV";
    const salary = card.find(".title-salary, .salary").first().text().trim() || null;
    const location = card.find(".address, .label-content .city-text").first().text().trim() || null;

    const skills: string[] = [];
    card.find(".skills .item, .tag, .label-content .item").each((__, tag) => {
      const text = $(tag).text().trim();
      if (text) skills.push(text);
    });

    return {
      source: "topcv",
      title,
      company,
      salary,
      location,
      url: detailUrl,
      jd: null,
      skills: skills.length ? skills : [keyword]
    };
  }

  private parseLinkFallback(
    $: CheerioAPI,
    link: ReturnType<CheerioAPI>,
    keyword: string,
    seenUrls: Set<string>
  ): RawJob | null {
    const detailUrl = normalizeTopCvJobUrl(link.attr("href"));
    const title = link.text().trim() || link.attr("title")?.trim() || "";
    if (!detailUrl || !title || seenUrls.has(detailUrl)) return null;
    seenUrls.add(detailUrl);

    return {
      source: "topcv",
      title,
      company: "TopCV",
      salary: null,
      location: null,
      url: detailUrl,
      jd: null,
      skills: [keyword]
    };
  }

  private resolveDetailUrl(card: ReturnType<CheerioAPI>): string | null {
    for (const selector of TITLE_LINK_SELECTORS) {
      const href = card.find(selector).first().attr("href");
      const normalized = normalizeTopCvJobUrl(href);
      if (normalized) return normalized;
    }
    return null;
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
