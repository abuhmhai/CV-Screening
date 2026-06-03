import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { JobStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateJobAlertDto, UpdateJobAlertDto } from "./dto/job-alert.dto";

interface AlertFilters {
  location?: string;
  jobType?: string;
  level?: string;
  category?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
}

@Injectable()
export class JobAlertService {
  private readonly logger = new Logger(JobAlertService.name);

  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.jobAlert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  create(userId: string, dto: CreateJobAlertDto) {
    return this.prisma.jobAlert.create({
      data: {
        userId,
        keyword: dto.keyword,
        filters: (dto.filters ?? {}) as Prisma.InputJsonValue,
        frequency: dto.frequency ?? "DAILY"
      }
    });
  }

  async update(userId: string, id: string, dto: UpdateJobAlertDto) {
    await this.ensureOwner(userId, id);
    return this.prisma.jobAlert.update({
      where: { id },
      data: {
        keyword: dto.keyword,
        filters: dto.filters !== undefined ? (dto.filters as Prisma.InputJsonValue) : undefined,
        frequency: dto.frequency,
        isActive: dto.isActive
      }
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwner(userId, id);
    await this.prisma.jobAlert.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensureOwner(userId: string, id: string) {
    const alert = await this.prisma.jobAlert.findUnique({ where: { id } });
    if (!alert || alert.userId !== userId) {
      throw new NotFoundException("Job alert not found");
    }
  }

  /** Runs hourly; delivers matching new jobs for due alerts as notifications. */
  @Cron(CronExpression.EVERY_HOUR)
  async deliverAlerts() {
    const alerts = await this.prisma.jobAlert.findMany({ where: { isActive: true } });
    if (alerts.length === 0) return;

    let delivered = 0;
    for (const alert of alerts) {
      const since = this.dueSince(alert.frequency, alert.lastSentAt);
      if (!since) continue;

      const where = this.buildWhere(alert.keyword, alert.filters as AlertFilters | null, since);
      const matches = await this.prisma.job.findMany({
        where,
        take: 10,
        orderBy: { publishedAt: "desc" },
        include: { company: true }
      });

      if (matches.length > 0) {
        await this.prisma.notification.create({
          data: {
            userId: alert.userId,
            type: "JOB_ALERT",
            title: `${matches.length} việc làm mới phù hợp`,
            body: matches
              .slice(0, 3)
              .map((j) => `${j.title}${j.company ? ` · ${j.company.name}` : ""}`)
              .join("\n"),
            data: { alertId: alert.id, jobIds: matches.map((j) => j.id) } as Prisma.InputJsonValue
          }
        });
        delivered += 1;
      }

      await this.prisma.jobAlert.update({
        where: { id: alert.id },
        data: { lastSentAt: new Date() }
      });
    }

    if (delivered > 0) {
      this.logger.log(`Delivered ${delivered} job alert notification(s)`);
    }
  }

  private dueSince(frequency: string, lastSentAt: Date | null): Date | null {
    const now = Date.now();
    const last = lastSentAt?.getTime() ?? 0;
    const intervals: Record<string, number> = {
      INSTANT: 60 * 60 * 1000,
      DAILY: 24 * 60 * 60 * 1000,
      WEEKLY: 7 * 24 * 60 * 60 * 1000
    };
    const interval = intervals[frequency] ?? intervals.DAILY;
    if (now - last < interval) return null;
    // Look back over the interval window for jobs published since last delivery.
    return new Date(lastSentAt ? last : now - interval);
  }

  private buildWhere(
    keyword: string | null,
    filters: AlertFilters | null,
    since: Date
  ): Prisma.JobWhereInput {
    const where: Prisma.JobWhereInput = {
      status: JobStatus.ACTIVE,
      publishedAt: { gte: since }
    };
    const and: Prisma.JobWhereInput[] = [];

    if (keyword) {
      and.push({
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } }
        ]
      });
    }
    if (filters?.location) where.location = { contains: filters.location, mode: "insensitive" };
    if (filters?.jobType) where.jobType = filters.jobType;
    if (filters?.level) where.level = filters.level;
    if (filters?.category) where.category = filters.category;
    if (filters?.isRemote) where.isRemote = true;
    if (typeof filters?.salaryMin === "number") {
      and.push({ OR: [{ maxSalary: { gte: filters.salaryMin } }, { maxSalary: null }] });
    }
    if (typeof filters?.salaryMax === "number") {
      and.push({ OR: [{ minSalary: { lte: filters.salaryMax } }, { minSalary: null }] });
    }
    if (filters?.skills && filters.skills.length > 0) {
      and.push({
        OR: filters.skills.map((skill) => ({ requiredSkills: { array_contains: skill } }))
      });
    }
    if (and.length > 0) where.AND = and;
    return where;
  }
}
