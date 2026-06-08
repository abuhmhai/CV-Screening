import { BadgeVariant } from "../components/ui/badge";
import { Application } from "./types";

export type CandidateApplicationDisplay = {
  label: string;
  variant: BadgeVariant;
  isAiLoading: boolean;
  hasScore: boolean;
};

export function applicationHasAiScore(application: Application) {
  const raw = application.aiResult?.overallScore;
  if (raw == null || raw === "") return false;
  const value = typeof raw === "string" ? parseFloat(raw) : Number(raw);
  return !Number.isNaN(value);
}

export function isAiScreeningInProgress(application: Application) {
  if (application.status === "WITHDRAWN") return false;
  return application.status === "AI_SCREENING" || (application.status === "APPLIED" && !applicationHasAiScore(application));
}

export function getCandidateApplicationDisplay(application: Application): CandidateApplicationDisplay {
  const hasScore = applicationHasAiScore(application);

  switch (application.status) {
    case "AI_SCREENING":
      return { label: "AI đang chấm", variant: "screening", isAiLoading: true, hasScore: false };
    case "APPLIED":
      if (hasScore) {
        return { label: "Ứng tuyển thành công", variant: "accepted", isAiLoading: false, hasScore: true };
      }
      return { label: "Đã nộp", variant: "pending", isAiLoading: true, hasScore: false };
    case "HR_REVIEW":
      return { label: "HR Đang xem", variant: "review", isAiLoading: false, hasScore };
    case "INTERVIEW":
      return { label: "Phỏng vấn", variant: "interview", isAiLoading: false, hasScore };
    case "OFFER":
      return { label: "Đề nghị", variant: "accepted", isAiLoading: false, hasScore };
    case "HIRED":
      return { label: "Đã tuyển", variant: "accepted", isAiLoading: false, hasScore };
    case "REJECTED":
      return { label: "Từ chối", variant: "rejected", isAiLoading: false, hasScore };
    case "WITHDRAWN":
      return { label: "Đã rút đơn", variant: "rejected", isAiLoading: false, hasScore: false };
    default:
      return { label: application.status, variant: "pending", isAiLoading: false, hasScore };
  }
}
