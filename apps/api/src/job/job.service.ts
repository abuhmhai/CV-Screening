import { Injectable, NotFoundException } from "@nestjs/common";
import { JobStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateJobDto } from "./dto/create-job.dto";

@Injectable()
export class JobService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.job.create({
      data: {
        companyId: payload.companyId,
        createdBy,
        title: payload.title,
        description: payload.description,
        jobType: payload.jobType,
        level: payload.level,
        minSalary: payload.minSalary,
        maxSalary: payload.maxSalary,
        location: payload.location,
        requiredSkills: payload.requiredSkills,
        status: JobStatus.DRAFT
      }
    });
  }
}
