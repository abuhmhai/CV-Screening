import { Injectable, NotFoundException } from "@nestjs/common";
import { visiblePosts } from "../social/post-access";
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

  async createReport(reporterId: string, payload: CreateReportInput) {
    let target: unknown;
    if (payload.contentType === "POST") target = await this.prisma.post.findFirst({ where: { id: payload.targetId, ...visiblePosts(reporterId) } });
    if (payload.contentType === "COMMENT") target = await this.prisma.comment.findFirst({ where: { id: payload.targetId, deletedAt: null, post: visiblePosts(reporterId) } });
    if (payload.contentType === "PROFILE") target = await this.prisma.user.findFirst({ where: { id: payload.targetId, deletedAt: null } });
    if (payload.contentType === "MESSAGE") target = await this.prisma.message.findFirst({ where: { id: payload.targetId, deletedAt: null, conversation: { participants: { some: { userId: reporterId } } } } });
    if (!target) throw new NotFoundException("Nội dung không tồn tại hoặc bạn không có quyền xem");
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

  async listReports() {
    const rows = await this.prisma.moderationReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      include: {
        reporter: { select: { id: true, email: true } }
      }
    });
    return Promise.all(rows.map(async row => {
      const target = row.targetType === "POST" ? await this.prisma.post.findUnique({ where: { id: row.targetId }, select: { content: true, mediaUrls: true } })
        : row.targetType === "MESSAGE" ? await this.prisma.message.findUnique({ where: { id: row.targetId }, select: { content: true } })
        : row.targetType === "COMMENT" ? await this.prisma.comment.findUnique({ where: { id: row.targetId }, select: { content: true } }) : null;
      return { ...row, target };
    }));
  }

  async resolveReport(id: string, action: "KEEP" | "DELETE") {
    const report = await this.prisma.moderationReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException("Báo cáo không tồn tại");
    return this.prisma.$transaction(async tx => {
      if (action === "DELETE") {
        if (report.targetType === "POST") await tx.post.updateMany({ where: { id: report.targetId }, data: { deletedAt: new Date() } });
        if (report.targetType === "MESSAGE") await tx.message.updateMany({ where: { id: report.targetId }, data: { deletedAt: new Date() } });
        if (report.targetType === "COMMENT") await tx.comment.updateMany({ where: { id: report.targetId }, data: { deletedAt: new Date() } });
      }
      return tx.moderationReport.update({ where: { id }, data: { status: action === "DELETE" ? "REMOVED" : "DISMISSED" } });
    });
  }

  listRecoveryRequests() {
    return this.prisma.passwordRecoveryRequest.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  }

  resolveRecoveryRequest(id: string) {
    return this.prisma.passwordRecoveryRequest.update({ where: { id }, data: { status: "RESOLVED" } });
  }
}
