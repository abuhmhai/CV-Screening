import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../common/cache/cache.service";
import { AiScreeningService } from "../ai-screening/ai-screening.service";
import { CrawlerService, CrawlSummary } from "./crawler/crawler.service";
import { QueryJobsDto } from "./dto/query-jobs.dto";
import { ScreenCvDto } from "./dto/screen-cv.dto";

const LIST_CACHE_TTL_SEC = 30 * 60; // 30 minutes
const VERSION_TTL_SEC = 30 * 24 * 60 * 60; // 30 days
const VERSION_KEY = "external-jobs:cache-version";
const CRAWL_KEYWORDS = [
  "react",
  "nodejs",
  "frontend",
  "backend",
  "fullstack",
  "python",
  "ai",
  "devops",
  "java",
  "mobile",
  "golang"
];

/** Condensed, readable digest of a crawled job posting. */
export interface ExternalJobSummary {
  id: string;
  source: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  url: string;
  skills: string[];
  description: string | null;
  requirements: string | null;
  highlights: string[];
  hasDetail: boolean;
}

/** Report returned to the client after AI screening a CV against a job. */
export interface CvScreeningReport {
  score: number;
  verdict: string;
  strengths: string[];
  gaps: string[];
  suggestion: string;
  keywords_matched: string[];
  keywords_missing: string[];
}

@Injectable()
export class ExternalJobsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ExternalJobsService.name);
  private readonly aiServiceUrl: string;
  private readonly screenTimeoutMs = 20_000;
  private crawlInFlight = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly aiScreening: AiScreeningService,
    private readonly crawler: CrawlerService
  ) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
  }

  // ─── Scheduled crawling ─────────────────────────────────────────────────────

  /** Kick off an immediate crawl on startup so the feed is never empty. */
  onApplicationBootstrap(): void {
    void this.runScheduledCrawl("startup");
  }

  /** Crawl every source every 30 minutes. */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduledCrawl(): Promise<void> {
    await this.runScheduledCrawl("cron");
  }

  private async runScheduledCrawl(trigger: string): Promise<void> {
    if (this.crawlInFlight) {
      this.logger.warn(`Skipping ${trigger} crawl — previous crawl still running`);
      return;
    }
    this.crawlInFlight = true;
    try {
      this.logger.log(`Crawl started (${trigger})`);
      const summary = await this.triggerCrawl(CRAWL_KEYWORDS);
      this.logger.log(
        `Crawl done (${trigger}): crawled=${summary.crawled} saved=${summary.saved} ` +
          `skipped=${summary.skipped} fallback=${summary.usedFallback}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Crawl failed (${trigger}): ${message}`);
    } finally {
      this.crawlInFlight = false;
    }
  }

  // ─── Reads ──────────────────────────────────────────────────────────────────

  async list(query: QueryJobsDto, userId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const skip = (page - 1) * limit;

    // User-specific saved jobs filter skips shared public cache
    if (query.savedOnly && userId) {
      const result = await this.queryDb(query, skip, limit, page, userId);
      return { ...result, cached: false };
    }

    const version = await this.getCacheVersion();
    const cacheKey = `external-jobs:v${version}:${CacheService.hashKey([
      query.source ?? "all",
      (query.keyword ?? "").toLowerCase(),
      (query.location ?? "").toLowerCase(),
      (query.level ?? "").toLowerCase(),
      String(page),
      String(limit)
    ])}`;

    const cached = await this.cache.get<Awaited<ReturnType<ExternalJobsService["queryDb"]>>>(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const result = await this.queryDb(query, skip, limit, page);
    await this.cache.set(cacheKey, result, LIST_CACHE_TTL_SEC);
    return { ...result, cached: false };
  }

  private async queryDb(query: QueryJobsDto, skip: number, limit: number, page: number, userId?: string) {
    const where: Prisma.ExternalJobWhereInput = { isActive: true };
    const and: Prisma.ExternalJobWhereInput[] = [];

    if (query.source) where.source = query.source;
    if (query.location) where.location = { contains: query.location, mode: "insensitive" };
    if (query.keyword) {
      and.push({
        OR: [
          { title: { contains: query.keyword, mode: "insensitive" } },
          { company: { contains: query.keyword, mode: "insensitive" } },
          { jd: { contains: query.keyword, mode: "insensitive" } }
        ]
      });
    }
    // `level` is not a stored column on external jobs; match it loosely against the title.
    if (query.level) {
      and.push({ title: { contains: query.level, mode: "insensitive" } });
    }
    if (query.savedOnly && userId) {
      where.savedBy = { some: { userId } };
    }
    if (and.length > 0) where.AND = and;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.externalJob.findMany({
        where,
        orderBy: { crawledAt: "desc" },
        skip,
        take: limit
      }),
      this.prisma.externalJob.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  }

  async getOne(id: string) {
    const job = await this.prisma.externalJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException("External job not found");
    }
    return job;
  }

  // ─── Bookmarks / Saved External Jobs ─────────────────────────────────────────

  async toggleSave(userId: string, externalJobId: string): Promise<{ saved: boolean }> {
    const job = await this.prisma.externalJob.findUnique({ where: { id: externalJobId } });
    if (!job) {
      throw new NotFoundException("External job not found");
    }
    const existing = await this.prisma.savedExternalJob.findUnique({
      where: { userId_externalJobId: { userId, externalJobId } }
    });
    if (existing) {
      await this.prisma.savedExternalJob.delete({
        where: { userId_externalJobId: { userId, externalJobId } }
      });
      return { saved: false };
    } else {
      await this.prisma.savedExternalJob.create({
        data: { userId, externalJobId }
      });
      return { saved: true };
    }
  }

  async unsave(userId: string, externalJobId: string): Promise<{ saved: boolean }> {
    await this.prisma.savedExternalJob.deleteMany({
      where: { userId, externalJobId }
    });
    return { saved: false };
  }

  async getSavedIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.savedExternalJob.findMany({
      where: { userId },
      select: { externalJobId: true }
    });
    return rows.map((r) => r.externalJobId);
  }

  // ─── Job summary ──────────────────────────────────────────────────────────────

  /**
   * Build a readable digest of a crawled job. If the stored JD is empty we fetch
   * the source detail page on demand, extract the description/requirements, and
   * persist them back so subsequent reads are instant. Results are cached.
   */
  async summarize(id: string): Promise<ExternalJobSummary> {
    const cacheKey = `external-job-summary:${id}`;
    const cached = await this.cache.get<ExternalJobSummary>(cacheKey);
    if (cached) return cached;

    let job = await this.getOne(id);
    let description = job.jd ?? "";
    let requirements = "";

    // Enrich from the source detail page when we don't already have a JD.
    if (!description || description.trim().length < 40) {
      const detail = await this.crawler.fetchJobDetail(job.url, job.source);
      if (detail) {
        description = detail.description || description;
        requirements = detail.requirements || "";
        const combined = [description, requirements].filter(Boolean).join("\n\n").trim();
        const updates: Prisma.ExternalJobUpdateInput = {};
        if (combined && combined !== job.jd) updates.jd = combined;
        if (detail.title && detail.title !== job.title) updates.title = detail.title;
        if (detail.salary && !job.salary) updates.salary = detail.salary;
        if (detail.company && (!job.company || job.company === "VietnamWorks")) {
          updates.company = detail.company;
        }
        if (Object.keys(updates).length > 0) {
          job = await this.prisma.externalJob.update({ where: { id }, data: updates });
          await this.bumpCacheVersion();
        }
      }
    } else {
      // Stored JD already contains description + requirements joined with a blank line.
      const parts = description.split(/\n\s*\n/);
      description = parts[0] ?? description;
      requirements = parts.slice(1).join("\n\n");
    }

    const skills = Array.isArray(job.skills) ? (job.skills as unknown[]).map(String) : [];
    const summary: ExternalJobSummary = {
      id: job.id,
      source: job.source,
      title: job.title,
      company: job.company,
      location: job.location ?? null,
      salary: job.salary ?? null,
      url: job.url,
      skills,
      description: description.trim() || null,
      requirements: requirements.trim() || null,
      highlights: this.buildHighlights(description, requirements),
      hasDetail: Boolean((description || requirements).trim())
    };

    await this.cache.set(cacheKey, summary, 6 * 60 * 60);
    return summary;
  }

  /** Pick the most informative lines as quick bullet highlights. */
  private buildHighlights(description: string, requirements: string): string[] {
    const lines = `${description}\n${requirements}`
      .split("\n")
      .map((line) => line.replace(/^[•\-\u2022\s]+/, "").trim())
      .filter((line) => line.length >= 12 && line.length <= 180);
    const unique: string[] = [];
    for (const line of lines) {
      if (!unique.includes(line)) unique.push(line);
      if (unique.length >= 5) break;
    }
    return unique;
  }

  // ─── AI screening ─────────────────────────────────────────────────────────────

  async screen(id: string, userId: string, payload: ScreenCvDto): Promise<CvScreeningReport> {
    const cv = await this.resolveCvText(userId, payload);
    const job = await this.getOne(id);
    const skills = Array.isArray(job.skills) ? (job.skills as unknown[]).map(String) : [];
    const jd = job.jd && job.jd.length > 0 ? job.jd : `${job.title} tại ${job.company}`;

    const remote = await this.screenRemote(job.id, jd, job.company, skills, cv);
    if (remote) return remote;

    // Fallback: reuse the platform AI screening engine (which itself falls back
    // to the local TS scorer) and map its result to the report shape.
    this.logger.warn("FastAPI /screening/cv unreachable — using local screening fallback");
    const jdText = [jd, skills.length ? `Required skills: ${skills.join(", ")}` : ""].filter(Boolean).join("\n");
    const result = await this.aiScreening.screen(cv, jdText, job.id, {
      requiredSkills: skills
    });
    if (!result) {
      return {
        score: 0,
        verdict: "Không phù hợp",
        strengths: [],
        gaps: ["Không thể phân tích CV vào lúc này."],
        suggestion: "Vui lòng thử lại sau.",
        keywords_matched: [],
        keywords_missing: skills
      };
    }
    return {
      score: Math.round(result.overall_score),
      verdict: this.verdictFor(result.overall_score),
      strengths: result.strengths ?? [],
      gaps: result.concerns ?? [],
      suggestion: result.explanation ?? "",
      keywords_matched: result.matched_skills ?? [],
      keywords_missing: result.missing_skills ?? []
    };
  }

  /** Loads CV text from an uploaded file or from the request body. */
  private async resolveCvText(userId: string, payload: ScreenCvDto): Promise<string> {
    if (payload.cvFileId) {
      const cvFile = await this.prisma.cvFile.findFirst({
        where: { id: payload.cvFileId, userId }
      });
      if (!cvFile) {
        throw new NotFoundException("CV file not found");
      }
      const text = (cvFile.extractedText ?? "").trim();
      if (text.length < 20) {
        throw new BadRequestException(
          "Không đọc được nội dung từ file CV này. Vui lòng tải lên lại file PDF hoặc DOCX có văn bản."
        );
      }
      return text;
    }

    const text = (payload.cv ?? "").trim();
    if (text.length < 20) {
      throw new BadRequestException("Vui lòng chọn CV hoặc tải lên file CV để chấm điểm.");
    }
    return text;
  }

  private async screenRemote(
    jobId: string,
    jd: string,
    company: string,
    skills: string[],
    cv: string
  ): Promise<CvScreeningReport | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.screenTimeoutMs);
    try {
      const response = await fetch(`${this.aiServiceUrl}/screening/cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, jd, company, skills, cv }),
        signal: controller.signal
      });
      if (!response.ok) {
        this.logger.warn(`AI screening service responded ${response.status}`);
        return null;
      }
      return (await response.json()) as CvScreeningReport;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`AI screening service unreachable: ${message}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private verdictFor(score: number): string {
    if (score >= 80) return "Phù hợp cao";
    if (score >= 65) return "Phù hợp";
    if (score >= 50) return "Cần cải thiện";
    return "Không phù hợp";
  }

  // ─── Crawl trigger + cache invalidation ────────────────────────────────────────

  async triggerCrawl(keywords?: string[]): Promise<CrawlSummary> {
    const summary = await this.crawler.crawlAll(
      keywords && keywords.length ? keywords : CRAWL_KEYWORDS
    );
    await this.bumpCacheVersion();
    return summary;
  }

  private async getCacheVersion(): Promise<number> {
    const version = await this.cache.get<number>(VERSION_KEY);
    return typeof version === "number" ? version : 1;
  }

  private async bumpCacheVersion(): Promise<void> {
    const next = (await this.getCacheVersion()) + 1;
    await this.cache.set(VERSION_KEY, next, VERSION_TTL_SEC);
  }
}
