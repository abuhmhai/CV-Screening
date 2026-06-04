import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { RawJob } from "./crawler.types";
import { resolveJobUrlForSave } from "./job-url.util";
import { SEED_EXTERNAL_JOBS } from "./seed-jobs";
import { TopCvCrawler } from "./topcv.crawler";
import { VietnamWorksCrawler } from "./vietnamworks.crawler";

export interface CrawlSummary {
  crawled: number;
  saved: number;
  skipped: number;
  usedFallback: boolean;
}

const DEFAULT_KEYWORDS = ["react", "nodejs", "fullstack", "python", "devops", "java"];

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly topCvCrawler: TopCvCrawler,
    private readonly vietnamWorksCrawler: VietnamWorksCrawler
  ) {}

  /** Runs every 6 hours. */
  @Cron("0 */6 * * *")
  async scheduledCrawl(): Promise<void> {
    this.logger.log("Scheduled crawl started");
    const summary = await this.crawlAll(DEFAULT_KEYWORDS);
    this.logger.log(
      `Scheduled crawl done: saved=${summary.saved} skipped=${summary.skipped} fallback=${summary.usedFallback}`
    );
  }

  /**
   * Runs every crawler for every keyword. Crawlers run with `Promise.allSettled`
   * so one failing source never blocks the others. If nothing was collected
   * (offline / blocked), a bundled seed set is used so the demo always has data.
   */
  async crawlAll(keywords: string[]): Promise<CrawlSummary> {
    const settled = await Promise.allSettled([
      this.runCrawler("TopCV", (keyword) => this.topCvCrawler.crawl(keyword), keywords),
      this.runCrawler("VietnamWorks", (keyword) => this.vietnamWorksCrawler.crawl(keyword), keywords)
    ]);

    const collected: RawJob[] = [];
    for (const result of settled) {
      if (result.status === "fulfilled") collected.push(...result.value);
      else this.logger.warn(`Crawler rejected: ${String(result.reason)}`);
    }

    let usedFallback = false;
    let jobs = collected;
    if (jobs.length === 0) {
      this.logger.warn("All crawlers returned no jobs — using seed fallback data");
      jobs = SEED_EXTERNAL_JOBS;
      usedFallback = true;
    }

    const { saved, skipped } = await this.deduplicateAndSave(jobs, usedFallback);
    return { crawled: jobs.length, saved, skipped, usedFallback };
  }

  private async runCrawler(
    name: string,
    crawl: (keyword: string) => Promise<RawJob[]>,
    keywords: string[]
  ): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    for (const keyword of keywords) {
      try {
        jobs.push(...(await crawl(keyword)));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`${name} crawl for "${keyword}" failed: ${message}`);
      }
    }
    return jobs;
  }

  /** Upserts by unique `url`, skipping duplicates and jobs without a valid posting link. */
  async deduplicateAndSave(
    jobs: RawJob[],
    allowBrowseUrls = false
  ): Promise<{ saved: number; skipped: number }> {
    const seenUrls = new Set<string>();
    let saved = 0;
    let skipped = 0;

    for (const job of jobs) {
      const canonicalUrl = resolveJobUrlForSave(job.url, job.source, allowBrowseUrls);
      if (!canonicalUrl || seenUrls.has(canonicalUrl)) {
        skipped += 1;
        continue;
      }
      seenUrls.add(canonicalUrl);

      const data = {
        source: job.source,
        title: job.title,
        company: job.company,
        salary: job.salary ?? null,
        location: job.location ?? null,
        jd: job.jd ?? null,
        skills: (job.skills ?? []) as Prisma.InputJsonValue,
        isActive: true,
        crawledAt: new Date()
      };

      try {
        await this.prisma.externalJob.upsert({
          where: { url: canonicalUrl },
          create: { ...data, url: canonicalUrl },
          update: data
        });
        saved += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to upsert "${canonicalUrl}": ${message}`);
        skipped += 1;
      }
    }

    return { saved, skipped };
  }
}
