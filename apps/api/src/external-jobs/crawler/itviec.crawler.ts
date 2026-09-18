// DISCLAIMER: For educational and aggregation purposes.
// Respects robots.txt. Rate-limited.
import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { BROWSER_USER_AGENT, RawJob, sleep } from "./crawler.types";
import { normalizeItViecJobUrl } from "./job-url.util";

const BASE_URL = "https://itviec.com";
const MAX_PAGES = 2;
const REQUEST_DELAY_MS = 1500;

@Injectable()
export class ItViecCrawler {
  private readonly logger = new Logger(ItViecCrawler.name);

  async crawl(keyword: string): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const seenUrls = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const url =
        page === 1
          ? `${BASE_URL}/it-jobs/${encodeURIComponent(keyword)}`
          : `${BASE_URL}/it-jobs/${encodeURIComponent(keyword)}?page=${page}`;

      try {
        const { data } = await axios.get<string>(url, {
          headers: {
            "User-Agent": BROWSER_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache"
          },
          timeout: 15_000,
          responseType: "text"
        });

        const parsed = this.parsePage(data, keyword, seenUrls);
        if (parsed.length === 0) break;
        jobs.push(...parsed);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`ITviec page ${page} for "${keyword}" failed: ${message}`);
        break;
      }

      await sleep(REQUEST_DELAY_MS);
    }

    return jobs;
  }

  private parsePage(html: string, keyword: string, seenUrls: Set<string>): RawJob[] {
    const $ = cheerio.load(html);
    const results: RawJob[] = [];

    const cards = $(".job-card, [data-search--job-selection-target='jobCard']");
    cards.each((_, element) => {
      const job = this.parseCard($, $(element), keyword, seenUrls);
      if (job) results.push(job);
    });

    return results;
  }

  private parseCard(
    $: CheerioAPI,
    card: ReturnType<CheerioAPI>,
    keyword: string,
    seenUrls: Set<string>
  ): RawJob | null {
    // Find job title link
    const titleLink = card.find("h3 a, a[href*='/it-jobs/']").first();
    const rawTitle = titleLink.text().trim().replace(/\s+/g, " ");
    const rawHref = titleLink.attr("href");

    if (!rawTitle || !rawHref) return null;

    const detailUrl = normalizeItViecJobUrl(rawHref);
    if (!detailUrl || seenUrls.has(detailUrl)) return null;
    seenUrls.add(detailUrl);

    // Company name
    let company = "";
    card.find('a[href*="/companies/"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && !company) company = text;
    });
    if (!company) {
      company =
        card.find(".employer-name, .company-name, [class*='employer'], [class*='company']").first().text().trim() ||
        "Doanh nghiệp IT";
    }

    // Salary
    let salary =
      card.find(".salary, [class*='salary']").first().text().trim().replace(/\s+/g, " ") || null;
    if (!salary || /sign in|đăng nhập/i.test(salary)) {
      salary = "Thương lượng";
    }

    // Location
    let location = "";
    card.find("span, div, p").each((_, el) => {
      const text = $(el).text().trim();
      if (
        !location &&
        /(Hồ Chí Minh|Ho Chi Minh|Hà Nội|Ha Noi|Đà Nẵng|Da Nang|Hybrid|Remote|Toàn quốc)/i.test(text) &&
        !/posted|ago|sign in/i.test(text)
      ) {
        location = text.replace(/\s+/g, " ");
      }
    });
    if (!location) {
      location = "Hồ Chí Minh / Hà Nội / Toàn quốc";
    }

    // Skills
    const skills: string[] = [];
    card.find(".tag, .badge, [class*='tag'], [class*='skill']").each((_, el) => {
      const tag = $(el).text().trim();
      if (tag && tag.length < 30 && !skills.includes(tag)) {
        skills.push(tag);
      }
    });
    if (skills.length === 0 && keyword) {
      skills.push(keyword.toUpperCase());
    }

    // Job brief / text
    const brief = card.find("ul, .job-description, .preview-text").text().trim().replace(/\s+/g, " ");
    const jd = `${rawTitle} tại ${company}. Địa điểm: ${location}. Mức lương: ${salary || "Thương lượng"}. Kỹ năng: ${skills.join(", ")}. ${brief}`;

    return {
      source: "itviec",
      title: rawTitle,
      company,
      salary,
      location,
      url: detailUrl,
      jd,
      skills
    };
  }
}
