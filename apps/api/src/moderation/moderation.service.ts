import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface CreateReportInput {
  contentType: "POST" | "COMMENT" | "PROFILE" | "MESSAGE";
  targetId: string;
  reason: string;
  detail?: string;
}

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  createReport(reporterId: string, payload: CreateReportInput) {
    return this.prisma.moderationReport.create({
      data: {
        reporterId,
        targetType: payload.contentType,
        targetId: payload.targetId,
        reason: payload.reason,
        details: payload.detail,
        status: "PENDING"
      }
    });
  }

  listReports() {
    return this.prisma.moderationReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      include: {
        reporter: { select: { id: true, email: true } }
      }
    });
  }
}
