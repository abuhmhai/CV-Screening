import { Injectable, NotFoundException } from "@nestjs/common";
import { JobStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { SearchJobsDto } from "./dto/search-jobs.dto";

@Injectable()
export class JobService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchJobsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const skip = (page - 1) * pageSize;

    const where: Prisma.JobWhereInput = { status: JobStatus.ACTIVE };
    const and: Prisma.JobWhereInput[] = [];

    if (query.keyword) {
      and.push({
        OR: [
          { title: { contains: query.keyword, mode: "insensitive" } },
          { description: { contains: query.keyword, mode: "insensitive" } }
        ]
      });
    }
    if (query.location) {
      where.location = { contains: query.location, mode: "insensitive" };
    }
    if (query.jobType) {
      where.jobType = query.jobType;
    }
    if (query.level) {
      where.level = query.level;
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.isRemote === "true") {
      where.isRemote = true;
    }
    if (typeof query.salaryMin === "number") {
      and.push({ OR: [{ maxSalary: { gte: query.salaryMin } }, { maxSalary: null }] });
    }
    if (typeof query.salaryMax === "number") {
      and.push({ OR: [{ minSalary: { lte: query.salaryMax } }, { minSalary: null }] });
    }
    if (query.skills && query.skills.length > 0) {
      // requiredSkills is a JSON array of strings; match any requested skill.
      and.push({
        OR: query.skills.map((skill) => ({
          requiredSkills: { array_contains: skill }
        }))
      });
    }
    if (and.length > 0) {
      where.AND = and;
    }

    const orderBy: Prisma.JobOrderByWithRelationInput =
      query.sort === "salary"
        ? { maxSalary: "desc" }
        : query.sort === "relevance"
          ? { viewsCount: "desc" }
          : { publishedAt: "desc" };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        include: {
          company: true,
          creator: { select: { id: true, email: true } },
          _count: { select: { applications: true } }
        },
        orderBy: [orderBy, { id: "desc" }],
        skip,
        take: pageSize
      }),
      this.prisma.job.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    };
  }

  async facets() {
    const active = { status: JobStatus.ACTIVE };
    const [byType, byLevel, byCategory] = await this.prisma.$transaction([
      this.prisma.job.groupBy({ by: ["jobType"], where: active, _count: true, orderBy: { jobType: "asc" } }),
      this.prisma.job.groupBy({ by: ["level"], where: active, _count: true, orderBy: { level: "asc" } }),
      this.prisma.job.groupBy({ by: ["category"], where: active, _count: true, orderBy: { category: "asc" } })
    ]);
    return {
      jobTypes: byType.map((r) => ({ value: r.jobType, count: r._count })),
      levels: byLevel.map((r) => ({ value: r.level, count: r._count })),
      categories: byCategory
        .filter((r) => r.category)
        .map((r) => ({ value: r.category as string, count: r._count }))
    };
  }

  async getOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
        creator: { select: { id: true, email: true } },
        _count: { select: { applications: true } }
      }
    });
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    return job;
  }

  list(status?: JobStatus, location?: string) {
    return this.prisma.job.findMany({
      where: {
        status: status ?? undefined,
        location: location ?? undefined
      },
      include: {
        company: true,
        creator: { select: { id: true, email: true } },
        _count: { select: { applications: true } }
      },
      orderBy: { id: "desc" }
    });
  }

  create(payload: CreateJobDto, createdBy: string) {
    const slug = `${slugify(payload.title)}-${Date.now().toString(36)}`;
    return this.prisma.job.create({
      data: {
        companyId: payload.companyId,
        createdBy,
        title: payload.title,
        description: payload.description,
        jobType: payload.jobType,
        level: payload.level,
        experienceLevel: payload.experienceLevel,
        category: payload.category,
        isRemote: payload.isRemote ?? false,
        minSalary: payload.minSalary,
        maxSalary: payload.maxSalary,
        salaryCurrency: payload.salaryCurrency ?? "VND",
        location: payload.location,
        requiredSkills: payload.requiredSkills,
        slug,
        status: JobStatus.DRAFT
      }
    });
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}
