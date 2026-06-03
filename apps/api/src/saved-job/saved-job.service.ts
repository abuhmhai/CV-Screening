import { Injectable, NotFoundException } from "@nestjs/common";
import { JobStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SavedJobService {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    await this.prisma.savedJob.upsert({
      where: { userId_jobId: { userId, jobId } },
      create: { userId, jobId },
      update: {}
    });
    return { saved: true };
  }

  async unsave(userId: string, jobId: string) {
    await this.prisma.savedJob.deleteMany({ where: { userId, jobId } });
    return { saved: false };
  }

  async listForUser(userId: string) {
    const saved = await this.prisma.savedJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          include: {
            company: true,
            _count: { select: { applications: true } }
          }
        }
      }
    });
    return saved.map((s) => ({ jobId: s.jobId, createdAt: s.createdAt, job: s.job }));
  }

  async savedIds(userId: string) {
    const rows = await this.prisma.savedJob.findMany({
      where: { userId },
      select: { jobId: true }
    });
    return rows.map((r) => r.jobId);
  }
}
