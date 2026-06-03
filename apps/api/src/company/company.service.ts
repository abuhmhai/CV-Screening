import { Injectable, NotFoundException } from "@nestjs/common";
import { ApplicationStatus, JobStatus, PostVisibility } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCompanyDto } from "./dto/create-company.dto";

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        industry: payload.industry,
        description: payload.description
      }
    });
  }

  async getPublicDetail(idOrSlug: string) {
    const company = await this.prisma.company.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
    });
    if (!company) {
      throw new NotFoundException("Company not found");
    }

    const [activeJobs, followerCount, jobsCount, posts] = await Promise.all([
      this.prisma.job.findMany({
        where: { companyId: company.id, status: JobStatus.ACTIVE },
        include: { company: true, _count: { select: { applications: true } } },
        orderBy: { publishedAt: "desc" },
        take: 20
      }),
      this.prisma.companyFollower.count({ where: { companyId: company.id } }),
      this.prisma.job.count({ where: { companyId: company.id } }),
      this.prisma.post.findMany({
        where: { companyId: company.id, deletedAt: null, visibility: PostVisibility.PUBLIC },
        include: { author: { include: { profile: true } } },
        orderBy: { createdAt: "desc" },
        take: 6
      })
    ]);

    return { company, activeJobs, followerCount, jobsCount, posts };
  }

  async follow(userId: string, companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException("Company not found");
    }
    await this.prisma.companyFollower.upsert({
      where: { userId_companyId: { userId, companyId } },
      create: { userId, companyId },
      update: {}
    });
    return { following: true };
  }

  async unfollow(userId: string, companyId: string) {
    await this.prisma.companyFollower.deleteMany({ where: { userId, companyId } });
    return { following: false };
  }

  async isFollowing(userId: string, companyId: string) {
    const row = await this.prisma.companyFollower.findUnique({
      where: { userId_companyId: { userId, companyId } }
    });
    return { following: Boolean(row) };
  }

  list() {
    return this.prisma.company.findMany({
      include: {
        members: { include: { user: { select: { id: true, email: true, role: true } } } },
        _count: { select: { jobs: true } }
      },
      orderBy: { name: "asc" }
    });
  }

  async analytics(companyId: string) {
    const [jobs, applications] = await Promise.all([
      this.prisma.job.findMany({
        where: { companyId },
        include: { _count: { select: { applications: true } } }
      }),
      this.prisma.application.findMany({
        where: { job: { companyId } },
        include: {
          aiResult: true,
          statusHistory: {
            where: { toStatus: ApplicationStatus.HIRED },
            orderBy: { changedAt: "asc" },
            take: 1
          }
        }
      })
    ]);

    const statusCounts = Object.values(ApplicationStatus).reduce<Record<string, number>>(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {}
    );
    for (const app of applications) {
      statusCounts[app.status] = (statusCounts[app.status] ?? 0) + 1;
    }

    const scores = applications
      .map((app) => Number(app.aiResult?.overallScore ?? 0))
      .filter((item) => !Number.isNaN(item) && item > 0);
    const avgAiScore = scores.length
      ? Number((scores.reduce((sum, item) => sum + item, 0) / scores.length).toFixed(2))
      : 0;

    const aiPassedStatuses = new Set<ApplicationStatus>([
      ApplicationStatus.HR_REVIEW,
      ApplicationStatus.INTERVIEW,
      ApplicationStatus.OFFER,
      ApplicationStatus.HIRED
    ]);
    const aiPassCount = applications.filter((app) => aiPassedStatuses.has(app.status)).length;
    const aiPassRate = applications.length
      ? Number(((aiPassCount / applications.length) * 100).toFixed(2))
      : 0;

    const hiredDurationsDays = applications
      .map((app) => {
        const hiredAt = app.statusHistory[0]?.changedAt;
        if (!hiredAt) return null;
        const durationMs = hiredAt.getTime() - app.appliedAt.getTime();
        return durationMs > 0 ? durationMs / (1000 * 60 * 60 * 24) : null;
      })
      .filter((value): value is number => value !== null);
    const avgTimeToHireDays = hiredDurationsDays.length
      ? Number(
          (hiredDurationsDays.reduce((sum, item) => sum + item, 0) / hiredDurationsDays.length).toFixed(2)
        )
      : 0;

    const hiredCount = applications.filter((app) => app.status === ApplicationStatus.HIRED).length;

    return {
      jobsCount: jobs.length,
      activeJobs: jobs.filter((job) => job.status === "ACTIVE").length,
      totalApplications: applications.length,
      avgAiScore,
      aiPassRate,
      hiredCount,
      avgTimeToHireDays,
      statusCounts
    };
  }
}
