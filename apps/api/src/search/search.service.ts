import { Injectable } from "@nestjs/common";
import { CacheService } from "../common/cache/cache.service";
import { PrismaService } from "../prisma/prisma.service";

const SEARCH_CACHE_TTL_SEC = Number(process.env.SEARCH_CACHE_TTL_SEC ?? "60");

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  async unifiedSearch(query: string, type = "all", limit = 10) {
    const take = Math.min(50, Math.max(1, limit));
    const q = query.trim();
    if (!q) {
      return {
        people: [],
        jobs: [],
        posts: [],
        companies: []
      };
    }

    const cacheKey = `search:${CacheService.hashKey([q.toLowerCase(), type, String(take)])}`;
    const cached = await this.cache.get<Awaited<ReturnType<SearchService["runUnifiedSearch"]>>>(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const result = await this.runUnifiedSearch(q, type, take);
    await this.cache.set(cacheKey, result, SEARCH_CACHE_TTL_SEC);
    return result;
  }

  private async runUnifiedSearch(q: string, type: string, take: number) {

    const peoplePromise =
      type === "all" || type === "people"
        ? this.prisma.user.findMany({
            where: {
              deletedAt: null,
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { profile: { fullName: { contains: q, mode: "insensitive" } } },
                { profile: { headline: { contains: q, mode: "insensitive" } } }
              ]
            },
            include: { profile: true },
            take
          })
        : Promise.resolve([]);

    const jobsPromise =
      type === "all" || type === "jobs"
        ? this.prisma.job.findMany({
            where: {
              status: "ACTIVE",
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { location: { contains: q, mode: "insensitive" } }
              ]
            },
            include: { company: true, _count: { select: { applications: true } } },
            take
          })
        : Promise.resolve([]);

    const postsPromise =
      type === "all" || type === "posts"
        ? this.prisma.post.findMany({
            where: {
              deletedAt: null,
              content: { contains: q, mode: "insensitive" }
            },
            include: {
              author: { include: { profile: true } },
              company: true
            },
            take
          })
        : Promise.resolve([]);

    const companiesPromise =
      type === "all" || type === "companies"
        ? this.prisma.company.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { industry: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } }
              ]
            },
            include: {
              jobs: { where: { status: "ACTIVE" }, take: 5 },
              _count: { select: { members: true } }
            },
            take
          })
        : Promise.resolve([]);

    const [people, jobs, posts, companies] = await Promise.all([
      peoplePromise,
      jobsPromise,
      postsPromise,
      companiesPromise
    ]);

    return { people, jobs, posts, companies };
  }
}
