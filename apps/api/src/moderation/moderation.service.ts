import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

export interface ReportItem {
  id: string;
  reporterId: string;
  contentType: "POST" | "COMMENT" | "PROFILE" | "MESSAGE";
  targetId: string;
  reason: string;
  detail?: string;
  status: "OPEN" | "REVIEWED" | "DISMISSED";
  createdAt: string;
}

@Injectable()
export class ModerationService {
  private readonly reports: ReportItem[] = [];

  createReport(
    reporterId: string,
    payload: Omit<ReportItem, "id" | "reporterId" | "status" | "createdAt">
  ) {
    const report: ReportItem = {
      id: randomUUID(),
      reporterId,
      contentType: payload.contentType,
      targetId: payload.targetId,
      reason: payload.reason,
      detail: payload.detail,
      status: "OPEN",
      createdAt: new Date().toISOString()
    };
    this.reports.unshift(report);
    return report;
  }

  listReports() {
    return this.reports.slice(0, 300);
  }
}
