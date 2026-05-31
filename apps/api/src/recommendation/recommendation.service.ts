import { Injectable } from "@nestjs/common";
import { CacheService } from "../common/cache/cache.service";
import { PrismaService } from "../prisma/prisma.service";

const RECOMMENDATION_CACHE_TTL_SEC = Number(process.env.RECOMMENDATION_CACHE_TTL_SEC ?? "120");

@Injectable()
export class RecommendationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  async recommendJobs(userId: string, limit = 10) {
    const cacheKey = `rec:jobs:${userId}:${limit}`;
    const cached = await this.cache.get<Awaited<ReturnType<RecommendationService["computeJobRecommendations"]>>>(
      cacheKey
    );
    if (cached) return cached;

    const result = await this.computeJobRecommendations(userId, limit);
    await this.cache.set(cacheKey, result, RECOMMENDATION_CACHE_TTL_SEC);
    return result;
  }

  private async computeJobRecommendations(userId: string, limit = 10) {
    const profile = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSkills: { include: { skill: true } },
        applications: { select: { jobId: true } }
      }
    });

    const appliedJobIds = new Set(profile?.applications.map((a) => a.jobId) ?? []);
    const skillKeywords = (profile?.userSkills ?? []).map((s) => s.skill.name.toLowerCase());

    const jobs = await this.prisma.job.findMany({
      where: {
        status: "ACTIVE",
        id: { notIn: Array.from(appliedJobIds) }
      },
      include: {
        company: true,
        _count: { select: { applications: true } }
      },
      take: Math.max(limit * 2, 20)
    });

    return jobs
      .map((job) => {
        const requiredSkills = Array.isArray(job.requiredSkills)
          ? job.requiredSkills.map((item) => String(item).toLowerCase())
          : [];
        const skillMatch = requiredSkills.filter((s) => skillKeywords.includes(s)).length;
        const popularityScore = Math.min(30, job._count.applications);
        return {
          ...job,
          recommendationScore: skillMatch * 20 + popularityScore
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);
  }

  async recommendPeople(userId: string, limit = 10) {
    const cacheKey = `rec:people:${userId}:${limit}`;
    const cached = await this.cache.get<Awaited<ReturnType<RecommendationService["computePeopleRecommendations"]>>>(
      cacheKey
    );
    if (cached) return cached;

    const result = await this.computePeopleRecommendations(userId, limit);
    await this.cache.set(cacheKey, result, RECOMMENDATION_CACHE_TTL_SEC);
    return result;
  }

  private async computePeopleRecommendations(userId: string, limit = 10) {
    const connections = await this.prisma.connection.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }]
      },
      select: { requesterId: true, addresseeId: true }
    });

    const excluded = new Set<string>([userId]);
    for (const conn of connections) {
      excluded.add(conn.requesterId);
      excluded.add(conn.addresseeId);
    }

    return this.prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excluded) },
        deletedAt: null
      },
      include: {
        profile: true,
        _count: {
          select: {
            requestedConnections: true,
            addressedConnections: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }
}
