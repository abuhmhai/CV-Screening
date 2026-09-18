// DISCLAIMER: For educational and aggregation purposes.
// Respects robots.txt. Rate-limited.
import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { BROWSER_USER_AGENT, RawJob, sleep } from "./crawler.types";
import { normalizeCareerVietJobUrl } from "./job-url.util";

const BASE_URL = "https://careerviet.vn";
const MAX_PAGES = 2;
const REQUEST_DELAY_MS = 1500;

@Injectable()
export class CareerVietCrawler {
  private readonly logger = new Logger(CareerVietCrawler.name);

  async crawl(keyword: string): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const seenUrls = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const url =
        page === 1
          ? `${BASE_URL}/viec-lam/${encodeURIComponent(keyword)}-k-vi.html`
          : `${BASE_URL}/viec-lam/${encodeURIComponent(keyword)}-k-trang-${page}-vi.html`;

      try {
        const { data } = await axios.get<string>(url, {
          headers: {
            "User-Agent": BROWSER_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi,en;q=0.9",
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
        this.logger.warn(`CareerViet page ${page} for "${keyword}" failed: ${message}`);
        break;
      }

      await sleep(REQUEST_DELAY_MS);
    }

    return jobs;
  }

  private parsePage(html: string, keyword: string, seenUrls: Set<string>): RawJob[] {
    const $ = cheerio.load(html);
    const results: RawJob[] = [];

    const cards = $(".job-item, .job-item-default, [class*='job-item']");
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
    // Specific detail link for job posting
    const titleLink = card.find("a[href*='/tim-viec-lam/']").first();
    const rawTitle = titleLink.text().trim().replace(/\s+/g, " ");
    const rawHref = titleLink.attr("href");

    if (!rawTitle || !rawHref) return null;

    const detailUrl = normalizeCareerVietJobUrl(rawHref);
    if (!detailUrl || seenUrls.has(detailUrl)) return null;
    seenUrls.add(detailUrl);

    // Company
    const company =
      card.find(".company-name a, .company-name, [class*='company']").first().text().trim() ||
      "Doanh nghiệp Tuyển dụng";

    // Salary
    let salary =
      card.find(".salary, [class*='salary']").first().text().trim().replace(/^Lương:\s*/i, "") || null;
    if (salary && /cạnh tranh/i.test(salary)) {
      salary = "Cạnh tranh";
    }

    // Location
    const location =
      card.find(".location, [class*='location']").first().text().trim() ||
      "Hồ Chí Minh / Hà Nội";

    // Skills
    const skills: string[] = [];
    if (keyword) {
      skills.push(keyword.toUpperCase());
    }
    const techKeywords = [
      "React",
      "NodeJS",
      "TypeScript",
      "JavaScript",
      "Python",
      "Golang",
      "Java",
      "AWS",
      "Docker",
      "Kubernetes",
      "NextJS",
      "VueJS",
      "SQL",
      "NoSQL",
      "Flutter",
      "React Native",
      "DevOps",
      "CI/CD"
    ];
    for (const tech of techKeywords) {
      const regex = new RegExp(`\\b${tech}\\b`, "i");
      if (regex.test(rawTitle) && !skills.includes(tech)) {
        skills.push(tech);
      }
    }
    card.find(".welfare li, .tags a, .tag").each((_, el) => {
      const tag = $(el).text().trim();
      if (tag && tag.length < 25 && !skills.includes(tag)) {
        skills.push(tag);
      }
    });

    const jd = `${rawTitle} tại ${company}. Khu vực: ${location}. Chế độ lương: ${salary || "Thỏa thuận"}. Kỹ năng yêu cầu: ${skills.join(", ")}.`;

    return {
      source: "careerviet",
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
