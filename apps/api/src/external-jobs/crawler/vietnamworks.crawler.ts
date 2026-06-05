// DISCLAIMER: For academic research (graduation thesis) only.
// Respects robots.txt. Rate-limited. Not for commercial use.
import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import * as cheerio from "cheerio";
import { BOT_USER_AGENT, RawJob, sleep } from "./crawler.types";
import { buildVietnamWorksJobUrl, normalizeVietnamWorksJobUrl } from "./job-url.util";
import {
  extractNextData,
  extractRscString,
  harvestRscJobHtml,
  htmlToText,
  isRscReference,
  looksLikeJunkTitle,
  sanitizeTitle,
  titleFromJvUrl
} from "./vnw-parse";

/** Structured job detail extracted from a VietnamWorks `-jv` page. */
export interface VnwJobDetail {
  title: string | null;
  company: string | null;
  salary: string | null;
  location: string | null;
  description: string;
  requirements: string;
}

interface OutstandingJob {
  jobTitle?: string;
  company?: string;
  companyName?: string;
  location?: string;
  salary?: string;
  prettySalary?: string;
  url?: string;
}

const LEGACY_SEARCH_URL = "https://ms.vietnamworks.com/job-search/v1.0/jobs";
const HTML_SEARCH_BASE = "https://www.vietnamworks.com/viec-lam";
const ALGOLIA_APP_ID = "JF8Q26WWUD";
const ALGOLIA_API_KEY = "ecef10153e66bbd6d54f08ea005b60fc";
const ALGOLIA_INDEX = "vnw_job_v2";
const ALGOLIA_QUERY_URL = `https://${ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;

const MAX_PAGES = 3;
const PAGE_SIZE = 20;
const REQUEST_DELAY_MS = 2000;

interface VnwJob {
  jobTitle?: string;
  companyName?: string;
  company?: string;
  jobUrl?: string;
  redirectUrl?: string;
  alias?: string;
  jobId?: number;
  objectID?: string | number;
  salaryMin?: number;
  salaryMax?: number;
  prettySalary?: string;
  workingLocations?: Array<{ cityName?: string; address?: string }>;
  locations?: string[];
  skills?: Array<{ skillName?: string } | string>;
  jobDescription?: string;
  jobRequirement?: string;
}

interface VnwResponse {
  data?: VnwJob[];
  hits?: VnwJob[];
}

/**
 * VietnamWorks: Algolia (browser search API) first, then legacy JSON, then HTML fallback.
 * Every persisted job must include a detail URL ending in -jv when possible.
 */
@Injectable()
export class VietnamWorksCrawler {
  private readonly logger = new Logger(VietnamWorksCrawler.name);

  async crawl(keyword: string): Promise<RawJob[]> {
    const algolia = await this.crawlAlgolia(keyword);
    if (algolia.length > 0) return algolia;

    const legacy = await this.crawlLegacyApi(keyword);
    if (legacy.length > 0) return legacy;

    return this.crawlHtmlSearch(keyword);
  }

  private async crawlAlgolia(keyword: string): Promise<RawJob[]> {
    const jobs: RawJob[] = [];

    for (let page = 0; page < MAX_PAGES; page += 1) {
      try {
        const { data } = await axios.post<VnwResponse>(
          ALGOLIA_QUERY_URL,
          { query: keyword, hitsPerPage: PAGE_SIZE, page },
          {
            headers: {
              "X-Algolia-Application-Id": ALGOLIA_APP_ID,
              "X-Algolia-API-Key": ALGOLIA_API_KEY,
              "Content-Type": "application/json",
              "User-Agent": BOT_USER_AGENT
            },
            timeout: 15_000
          }
        );

        const items = Array.isArray(data?.hits) ? data.hits : [];
        if (items.length === 0) break;

        for (const item of items) {
          const mapped = this.mapJob(item, keyword);
          if (mapped) jobs.push(mapped);
        }
      } catch (error) {
        this.logger.warn(`VietnamWorks Algolia page ${page} for "${keyword}" failed: ${this.message(error)}`);
        break;
      }

      await sleep(REQUEST_DELAY_MS);
    }

    return jobs;
  }

  private async crawlLegacyApi(keyword: string): Promise<RawJob[]> {
    const jobs: RawJob[] = [];

    for (let page = 0; page < MAX_PAGES; page += 1) {
      try {
        const { data } = await axios.get<VnwResponse>(LEGACY_SEARCH_URL, {
          params: { query: keyword, page, size: PAGE_SIZE },
          headers: {
            "User-Agent": BOT_USER_AGENT,
            Accept: "application/json",
            "Accept-Language": "vi,en;q=0.8"
          },
          timeout: 15_000
        });

        const items = Array.isArray(data?.data) ? data.data : [];
        if (items.length === 0) break;

        for (const item of items) {
          const mapped = this.mapJob(item, keyword);
          if (mapped) jobs.push(mapped);
        }
      } catch (error) {
        this.logger.warn(`VietnamWorks legacy API page ${page} for "${keyword}" failed: ${this.message(error)}`);
        break;
      }

      await sleep(REQUEST_DELAY_MS);
    }

    return jobs;
  }

  private async crawlHtmlSearch(keyword: string): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const seenUrls = new Set<string>();

    try {
      const { data } = await axios.get<string>(HTML_SEARCH_BASE, {
        params: { q: keyword },
        headers: { "User-Agent": BOT_USER_AGENT, "Accept-Language": "vi,en;q=0.8" },
        timeout: 15_000,
        responseType: "text"
      });

      // 1) Structured jobs embedded in the Next.js __NEXT_DATA__ blob (clean titles).
      const nextData = extractNextData(data) as
        | { props?: { pageProps?: { outstandingJobs?: OutstandingJob[] } } }
        | null;
      const outstanding = nextData?.props?.pageProps?.outstandingJobs ?? [];
      for (const item of outstanding) {
        const url = normalizeVietnamWorksJobUrl(item.url);
        if (!url || seenUrls.has(url)) continue;
        const title = this.resolveTitle(item.jobTitle, url);
        if (!title) continue;
        seenUrls.add(url);
        jobs.push({
          source: "vietnamworks",
          title,
          company: item.company || item.companyName || "VietnamWorks",
          salary: item.prettySalary || item.salary || null,
          location: item.location || null,
          url,
          jd: null,
          skills: [keyword]
        });
      }

      // 2) Anchor fallback for breadth — titles are sanitized / derived from the slug.
      const $ = cheerio.load(data);
      $("a[href]").each((_, element) => {
        const url = normalizeVietnamWorksJobUrl($(element).attr("href"));
        if (!url || seenUrls.has(url)) return;
        const rawTitle = $(element).text().trim() || $(element).attr("title")?.trim() || "";
        const title = this.resolveTitle(rawTitle, url);
        if (!title) return;
        seenUrls.add(url);

        jobs.push({
          source: "vietnamworks",
          title,
          company: "VietnamWorks",
          salary: null,
          location: null,
          url,
          jd: null,
          skills: [keyword]
        });
      });
    } catch (error) {
      this.logger.warn(`VietnamWorks HTML search for "${keyword}" failed: ${this.message(error)}`);
    }

    return jobs;
  }

  /** Clean a title, falling back to the URL slug when the scraped text is junk. */
  private resolveTitle(raw: string | null | undefined, url: string): string | null {
    const cleaned = sanitizeTitle(raw);
    if (cleaned && !looksLikeJunkTitle(cleaned)) return cleaned;
    return titleFromJvUrl(url);
  }

  /**
   * Fetch a single job detail page and extract clean fields from the RSC payload.
   * Used on demand to summarize a job; never part of the scheduled crawl.
   */
  async fetchJobDetail(url: string): Promise<VnwJobDetail | null> {
    const normalized = normalizeVietnamWorksJobUrl(url);
    if (!normalized) return null;
    try {
      const { data } = await axios.get<string>(normalized, {
        headers: { "User-Agent": BOT_USER_AGENT, "Accept-Language": "vi,en;q=0.8" },
        timeout: 15_000,
        responseType: "text"
      });
      const descRaw = extractRscString(data, "jobDescription");
      const reqRaw = extractRscString(data, "jobRequirement");
      let description = isRscReference(descRaw) ? "" : htmlToText(descRaw);
      let requirements = isRscReference(reqRaw) ? "" : htmlToText(reqRaw);

      // When the JD/requirements are streamed as `$<id>` references, recover them
      // from the length-prefixed RSC text rows.
      if (!description && !requirements) {
        description = htmlToText(harvestRscJobHtml(data));
      }

      const rawTitle = extractRscString(data, "jobTitle");
      const title = this.resolveTitle(isRscReference(rawTitle) ? null : rawTitle, normalized);
      const companyRaw = extractRscString(data, "companyName");
      const company = isRscReference(companyRaw) ? null : sanitizeTitle(companyRaw) || null;
      const salaryRaw = extractRscString(data, "prettySalary");
      const salary = isRscReference(salaryRaw) ? null : sanitizeTitle(salaryRaw) || null;

      if (!description && !requirements && !title) return null;

      return { title, company, salary, location: null, description, requirements };
    } catch (error) {
      this.logger.warn(`VietnamWorks detail fetch for "${normalized}" failed: ${this.message(error)}`);
      return null;
    }
  }

  private mapJob(item: VnwJob, keyword: string): RawJob | null {
    const title = sanitizeTitle(item.jobTitle);
    if (!title) return null;

    const url = buildVietnamWorksJobUrl({
      jobUrl: item.jobUrl,
      redirectUrl: item.redirectUrl,
      alias: item.alias,
      jobId: item.jobId,
      objectID: item.objectID,
      jobTitle: title
    });
    if (!url) return null;

    const location =
      item.workingLocations
        ?.map((loc) => loc.cityName || loc.address)
        .filter(Boolean)
        .join(", ") ||
      item.locations?.filter(Boolean).join(", ") ||
      null;

    const skills = (item.skills ?? [])
      .map((skill) => (typeof skill === "string" ? skill : skill.skillName))
      .filter((value): value is string => Boolean(value));

    const salary =
      item.prettySalary?.trim() ||
      (item.salaryMin && item.salaryMax ? `${item.salaryMin} - ${item.salaryMax}` : null);

    const jd = [item.jobDescription, item.jobRequirement].filter(Boolean).join("\n\n").trim() || null;

    return {
      source: "vietnamworks",
      title,
      company: item.companyName?.trim() || item.company?.trim() || "VietnamWorks",
      salary,
      location,
      url,
      jd,
      skills: skills.length ? skills : [keyword]
    };
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
