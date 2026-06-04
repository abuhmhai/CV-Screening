import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
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
export class ExternalJobsService {
  private readonly logger = new Logger(ExternalJobsService.name);
  private readonly aiServiceUrl: string;
  private readonly screenTimeoutMs = 20_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly aiScreening: AiScreeningService,
    private readonly crawler: CrawlerService
  ) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
  }

  // ─── Reads ──────────────────────────────────────────────────────────────────

  async list(query: QueryJobsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const skip = (page - 1) * limit;

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

  private async queryDb(query: QueryJobsDto, skip: number, limit: number, page: number) {
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
      keywords && keywords.length ? keywords : ["react", "nodejs", "fullstack", "python", "devops", "java"]
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
