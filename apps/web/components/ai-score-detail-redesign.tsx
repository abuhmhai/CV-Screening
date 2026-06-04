"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Download,
  FileSearch,
  FileText,
  GraduationCap,
  Languages,
  Link2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserCircle2,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api-client";
import { Application, ApplicationStatus } from "../lib/types";
import { compareCvWithJob, parseCv } from "../lib/cv-parse";
import { formatAmount, formatDate, formatDateTime, offerStatusLabel, statusLabel } from "../lib/format";
import { Badge, StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, PageHeader } from "./ui/card";
import { FieldLabel, Input, Textarea } from "./ui/input";
import { ErrorBlock, LoadingBlock } from "./ui/states";
import { CountUp } from "./ui/count-up";
import { AnimatedContent } from "./ui/animated-content";

type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

type CriteriaItem = {
  key: "skills" | "experience" | "education" | "other";
  label: string;
  score: number;
  weight: number;
  benchmark: number;
};

const dummyData = {
  jobTitle: "Backend Engineer",
  company: "TalentFlow Vietnam",
  location: "Ho Chi Minh City",
  candidateName: "Nguyen Minh Khoa",
  candidateEmail: "khoa.nguyen@example.com",
  headline: "Backend Engineer | Node.js | PostgreSQL | Redis",
  bio: "5+ years building scalable recruitment and fintech APIs, strong ownership mindset, and production incident response experience.",
  cvFileName: "Nguyen-Minh-Khoa-Backend-Engineer-CV.pdf",
  cvFileUrl: "#",
  coverLetter:
    "I am excited to contribute to TalentFlow's hiring intelligence platform by improving backend reliability and data quality for AI screening workflows.",
  requiredSkills: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "Docker", "AWS"],
  skills: [
    { name: "Node.js", years: 5, level: "EXPERT" as SkillLevel },
    { name: "TypeScript", years: 4, level: "ADVANCED" as SkillLevel },
    { name: "PostgreSQL", years: 4, level: "ADVANCED" as SkillLevel },
    { name: "Redis", years: 3, level: "INTERMEDIATE" as SkillLevel },
    { name: "Docker", years: 3, level: "INTERMEDIATE" as SkillLevel }
  ],
  experiences: [
    {
      id: "exp-1",
      position: "Senior Backend Engineer",
      company: "SaaSFlow",
      startDate: "2022-01-01",
      endDate: null,
      isCurrent: true,
      description: "Led API architecture for a multi-tenant B2B platform and reduced p95 latency by 32%."
    },
    {
      id: "exp-2",
      position: "Backend Engineer",
      company: "CloudRecruit",
      startDate: "2019-06-01",
      endDate: "2021-12-01",
      isCurrent: false,
      description: "Built interview scheduling and notification services with event-driven architecture."
    }
  ],
  educations: [
    { id: "edu-1", school: "HCMUT", degree: "B.Sc Computer Science", major: "Software Engineering", startYear: 2015, endYear: 2019, gpa: "3.42" }
  ],
  overallScore: 84,
  grade: "B",
  processingTimeMs: 1820,
  criteria: [
    { key: "skills", label: "Kỹ năng chuyên môn", score: 88, weight: 40, benchmark: 75 },
    { key: "experience", label: "Kinh nghiệm làm việc", score: 82, weight: 30, benchmark: 70 },
    { key: "education", label: "Nền tảng học vấn", score: 78, weight: 20, benchmark: 65 },
    { key: "other", label: "Tiêu chí khác", score: 80, weight: 10, benchmark: 60 }
  ] as CriteriaItem[],
  matchedSkills: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "Docker"],
  missingSkills: ["AWS"],
  strengths: [
    "Backend skills align strongly with JD requirements and production use-cases.",
    "Demonstrates strong API design and ownership in cross-functional projects.",
    "Clear impact metrics and stable tenure in recent role."
  ],
  concerns: ["Cloud deployment experience on AWS is limited; needs ramp-up for infra-heavy responsibilities."],
  explanation: "Candidate is highly suitable for technical interview with focus on cloud architecture depth."
};

const LEVEL_LABELS: Record<string, string> = {
  EXPERT: "Chuyên gia",
  ADVANCED: "Nâng cao",
  INTERMEDIATE: "Trung cấp",
  BEGINNER: "Cơ bản"
};

function toNumber(value: string | number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function gradeTone(grade: string) {
  if (grade.startsWith("A")) return "bg-accent-green-glow text-positive border-hairline-strong";
  if (grade.startsWith("B")) return "bg-accent-blue-glow text-link border-hairline-strong";
  if (grade.startsWith("C")) return "bg-accent-yellow-glow text-warning border-hairline-strong";
  return "bg-accent-red-glow text-negative border-hairline-strong";
}

function levelTone(level?: string | null) {
  if (level === "EXPERT") return "bg-accent-green-glow text-positive";
  if (level === "ADVANCED") return "bg-accent-blue-glow text-link";
  if (level === "INTERMEDIATE") return "bg-accent-yellow-glow text-warning";
  return "bg-surface-elevated text-ink";
}

function levelLabel(level?: string | null) {
  return LEVEL_LABELS[level ?? ""] ?? level ?? "Cơ bản";
}

function formatExperienceRange(startDate: string, endDate?: string | null, isCurrent?: boolean) {
  return `${formatDate(startDate)} - ${isCurrent ? "Hiện tại" : formatDate(endDate)}`;
}

function formatSkillList(skills: string[], max = 6): string {
  if (!skills.length) return "";
  const shown = skills.slice(0, max);
  const rest = skills.length - shown.length;
  const joined = shown.join(", ");
  return rest > 0 ? `${joined} và ${rest} kỹ năng khác` : joined;
}

interface DetailedEvaluation {
  strengths: string[];
  concerns: string[];
  recommendation: string;
  recommendationTone: "positive" | "neutral" | "negative";
}

interface HrSuggestion {
  status: ApplicationStatus;
  title: string;
  body: string;
  tone: "positive" | "warning" | "negative";
  note: string;
}

interface EvaluationInput {
  hasCvText: boolean;
  criteria: CriteriaItem[];
  overallScore: number;
  grade: string;
  matched: string[];
  missing: string[];
  extra: string[];
  matchPct: number;
  requiredCount: number;
  totalYears: number;
  topSkill: { name: string; years: number; level: SkillLevel } | null;
  education: string[];
  languages: string[];
  certifications: string[];
  aiStrengths: string[];
  aiConcerns: string[];
}

function dedupe(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (!item.trim() || seen.has(key)) continue;
    seen.add(key);
    result.push(item.trim());
    if (result.length >= limit) break;
  }
  return result;
}

/**
 * Builds a data-driven, Vietnamese evaluation by combining AI-provided notes
 * with concrete numbers (per-criteria scores vs. benchmark, JD match %, missing
 * skills, years of experience, education, languages) so the section is specific
 * rather than generic boilerplate.
 */
function buildDetailedEvaluation(input: EvaluationInput): DetailedEvaluation {
  const strengths: string[] = [...input.aiStrengths];
  const concerns: string[] = [...input.aiConcerns];

  for (const item of input.criteria) {
    if (item.score >= item.benchmark) {
      const delta = Math.round(item.score - item.benchmark);
      strengths.push(
        `${item.label} đạt ${item.score.toFixed(0)}/100 điểm, vượt mốc tham chiếu ${item.benchmark}${delta > 0 ? ` (+${delta} điểm)` : ""}.`
      );
    } else {
      const delta = Math.round(item.benchmark - item.score);
      concerns.push(
        `${item.label} mới đạt ${item.score.toFixed(0)}/100 điểm, dưới mốc tham chiếu ${item.benchmark} (-${delta} điểm) — cần làm rõ thêm khi phỏng vấn.`
      );
    }
  }

  if (input.requiredCount > 0) {
    if (input.matched.length) {
      strengths.push(
        `Đáp ứng ${input.matched.length}/${input.requiredCount} kỹ năng yêu cầu (${input.matchPct}%): ${formatSkillList(input.matched)}.`
      );
    }
    if (input.missing.length) {
      concerns.push(
        `Còn thiếu ${input.missing.length} kỹ năng quan trọng so với JD: ${formatSkillList(input.missing)}. Đề xuất kiểm tra trực tiếp trong vòng phỏng vấn.`
      );
    }
  }

  if (input.extra.length) {
    strengths.push(`Có thêm ${input.extra.length} kỹ năng ngoài yêu cầu (${formatSkillList(input.extra)}) — giá trị cộng thêm cho đội ngũ.`);
  }

  if (input.topSkill) {
    strengths.push(
      `Thế mạnh nổi bật: ${input.topSkill.name} với ${input.topSkill.years} năm kinh nghiệm (cấp độ ${levelLabel(input.topSkill.level)}).`
    );
  }

  if (input.totalYears > 0) {
    strengths.push(`Nội dung CV thể hiện khoảng ${input.totalYears} năm kinh nghiệm liên quan.`);
  }

  if (input.education.length) {
    strengths.push(`Nền tảng học vấn rõ ràng: ${input.education[0]}.`);
  } else if (input.hasCvText) {
    concerns.push("Chưa trích xuất được thông tin học vấn rõ ràng từ CV.");
  }

  if (input.languages.length) {
    strengths.push(`Có năng lực ngoại ngữ: ${input.languages.join(", ")}.`);
  } else if (input.hasCvText) {
    concerns.push("Chưa thấy thông tin ngoại ngữ trong CV — cần xác nhận nếu vị trí yêu cầu.");
  }

  if (input.hasCvText && !input.certifications.length) {
    concerns.push("Không tìm thấy chứng chỉ chuyên môn trong CV.");
  }

  if (input.matchPct < 50 && input.requiredCount > 0) {
    concerns.push(`Mức độ khớp tổng thể với JD còn thấp (${input.matchPct}%), rủi ro lệch yêu cầu chuyên môn.`);
  }

  if (!input.hasCvText) {
    concerns.push("Chưa đọc được nội dung file CV nên đánh giá dựa trên hồ sơ khai báo; nên chấm lại sau khi ứng viên tải lại CV.");
  }

  let recommendation: string;
  let recommendationTone: DetailedEvaluation["recommendationTone"];
  if (input.overallScore >= 80) {
    recommendationTone = "positive";
    recommendation = `Tổng điểm ${input.overallScore.toFixed(1)}/100 (xếp loại ${input.grade}). Đề xuất MỜI PHỎNG VẤN${
      input.missing.length ? `, tập trung làm rõ các kỹ năng còn thiếu (${formatSkillList(input.missing, 4)})` : ""
    }.`;
  } else if (input.overallScore >= 60) {
    recommendationTone = "neutral";
    recommendation = `Tổng điểm ${input.overallScore.toFixed(1)}/100 (xếp loại ${input.grade}). CÂN NHẮC PHỎNG VẤN${
      input.missing.length ? `; cần đánh giá sâu các kỹ năng còn thiếu (${formatSkillList(input.missing, 4)})` : ""
    } và các tiêu chí dưới mốc tham chiếu.`;
  } else {
    recommendationTone = "negative";
    recommendation = `Tổng điểm ${input.overallScore.toFixed(1)}/100 (xếp loại ${input.grade}). Hồ sơ CHƯA PHÙ HỢP ở thời điểm hiện tại do nhiều tiêu chí dưới mốc tham chiếu${
      input.missing.length ? ` và thiếu kỹ năng cốt lõi (${formatSkillList(input.missing, 4)})` : ""
    }.`;
  }

  return {
    strengths: dedupe(strengths, 7),
    concerns: dedupe(concerns, 7),
    recommendation,
    recommendationTone
  };
}

function buildHrSuggestion(input: {
  overallScore: number;
  matchPct: number;
  missingCount: number;
  requiredCount: number;
  concernsCount: number;
}): HrSuggestion {
  const missingRatio = input.requiredCount ? input.missingCount / input.requiredCount : 0;
  if (input.overallScore >= 80 && input.matchPct >= 70) {
    return {
      status: "INTERVIEW",
      title: "Phù hợp - mời phỏng vấn",
      body: `Ứng viên đạt ${input.overallScore.toFixed(1)}/100 và khớp ${input.matchPct}% kỹ năng yêu cầu. Nên chuyển sang vòng phỏng vấn để xác nhận chuyên môn và văn hóa.`,
      tone: "positive",
      note: `AI gợi ý phù hợp: điểm ${input.overallScore.toFixed(1)}/100, khớp ${input.matchPct}% yêu cầu.`
    };
  }

  if (input.overallScore < 60 || missingRatio >= 0.5) {
    return {
      status: "REJECTED",
      title: "Chưa phù hợp - cân nhắc từ chối",
      body: `Ứng viên hiện đạt ${input.overallScore.toFixed(1)}/100, khớp ${input.matchPct}% và còn thiếu ${input.missingCount}/${input.requiredCount} kỹ năng yêu cầu.`,
      tone: "negative",
      note: `AI gợi ý chưa phù hợp: điểm ${input.overallScore.toFixed(1)}/100, thiếu ${input.missingCount}/${input.requiredCount} kỹ năng yêu cầu.`
    };
  }

  return {
    status: "HR_REVIEW",
    title: "Cần HR review thêm",
    body: `Ứng viên có tín hiệu tiềm năng nhưng còn ${input.concernsCount} điểm cần làm rõ. Nên giữ ở HR Review và ghi chú các điểm cần kiểm tra.`,
    tone: "warning",
    note: `AI gợi ý cần review thêm: điểm ${input.overallScore.toFixed(1)}/100, khớp ${input.matchPct}% yêu cầu.`
  };
}

export function AiScoreDetailRedesign() {
  const params = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescreening, setRescreening] = useState(false);
  const [showRawCv, setShowRawCv] = useState(false);
  const [hrNote, setHrNote] = useState("");
  const [interviewAt, setInterviewAt] = useState("");
  const [hrActionLoading, setHrActionLoading] = useState<ApplicationStatus | "RESCREEN" | null>(null);
  const [offerForm, setOfferForm] = useState({
    salaryAmount: "",
    startDate: "",
    responseDeadline: "",
    offerLetterUrl: "",
    note: ""
  });
  const [offerLoading, setOfferLoading] = useState(false);

  const loadApplication = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch<Application>(`/applications/${params.id}`, { token });
    if (!res.ok) {
      setError(res.error ?? "Không tải được chi tiết AI Score.");
      setLoading(false);
      return;
    }
    setApplication(res.data ?? null);
    setError(null);
    setLoading(false);
  }, [params.id, token]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  const view = useMemo(() => {
    const ai = application?.aiResult;
    const criteria: CriteriaItem[] = [
      { key: "skills", label: "Kỹ năng chuyên môn", score: toNumber(ai?.skillScore, dummyData.criteria[0].score), weight: 40, benchmark: 75 },
      { key: "experience", label: "Kinh nghiệm làm việc", score: toNumber(ai?.experienceScore, dummyData.criteria[1].score), weight: 30, benchmark: 70 },
      { key: "education", label: "Nền tảng học vấn", score: toNumber(ai?.educationScore, dummyData.criteria[2].score), weight: 20, benchmark: 65 },
      { key: "other", label: "Tiêu chí khác", score: toNumber(ai?.otherScore, dummyData.criteria[3].score), weight: 10, benchmark: 60 }
    ];

    return {
      jobTitle: application?.job?.title ?? dummyData.jobTitle,
      company: application?.job?.company?.name ?? dummyData.company,
      location: application?.job?.location ?? dummyData.location,
      candidateName: application?.candidate?.profile?.fullName ?? dummyData.candidateName,
      candidateEmail: application?.candidate?.email ?? dummyData.candidateEmail,
      headline: application?.candidate?.profile?.headline ?? dummyData.headline,
      bio: application?.candidate?.profile?.about ?? dummyData.bio,
      cvFileName: application?.cvFile?.fileName ?? dummyData.cvFileName,
      cvFileUrl: application?.cvFile?.fileUrl ?? dummyData.cvFileUrl,
      coverLetter: application?.coverLetter ?? dummyData.coverLetter,
      requiredSkills: application?.job?.requiredSkills?.length ? application.job.requiredSkills : dummyData.requiredSkills,
      skills: application?.candidate?.userSkills?.length
        ? application.candidate.userSkills.map((item) => ({
            name: item.skill.name,
            years: toNumber(item.yearsExp, 0),
            level: (item.level as SkillLevel | undefined) ?? "BEGINNER"
          }))
        : dummyData.skills,
      experiences: application?.candidate?.workExperiences?.length ? application.candidate.workExperiences : dummyData.experiences,
      educations: application?.candidate?.educations?.length ? application.candidate.educations : dummyData.educations,
      overallScore: toNumber(ai?.overallScore, dummyData.overallScore),
      grade: ai?.grade ?? dummyData.grade,
      processingTimeMs: ai?.processingTimeMs ?? dummyData.processingTimeMs,
      criteria,
      matchedSkills: ai?.matchedSkills?.length ? ai.matchedSkills : dummyData.matchedSkills,
      missingSkills: ai?.missingSkills?.length ? ai.missingSkills : dummyData.missingSkills,
      strengths: ai?.strengths?.length ? ai.strengths : dummyData.strengths,
      concerns: ai?.concerns?.length ? ai.concerns : dummyData.concerns,
      explanation: ai?.explanation ?? dummyData.explanation
    };
  }, [application]);

  const cvText = application?.cvFile?.extractedText ?? "";

  const parsedCv = useMemo(() => parseCv(cvText, view.requiredSkills), [cvText, view.requiredSkills]);
  const cvComparison = useMemo(() => compareCvWithJob(cvText, view.requiredSkills), [cvText, view.requiredSkills]);

  // When the CV text is readable, drive the skill analysis from the actual CV
  // content (compareCvWithJob) so "Kỹ năng phù hợp / còn thiếu" matches what the
  // CV really contains. Otherwise fall back to the AI/declared result.
  const skillAnalysis = useMemo(() => {
    if (parsedCv.hasText) {
      return {
        matched: cvComparison.matched,
        missing: cvComparison.missing,
        extra: cvComparison.extra,
        fromCv: true
      };
    }
    return {
      matched: view.matchedSkills,
      missing: view.missingSkills,
      extra: [] as string[],
      fromCv: false
    };
  }, [parsedCv.hasText, cvComparison, view.matchedSkills, view.missingSkills]);

  const detailedEvaluation = useMemo(() => {
    const topSkill = [...view.skills].sort((a, b) => toNumber(b.years) - toNumber(a.years))[0] ?? null;
    return buildDetailedEvaluation({
      hasCvText: parsedCv.hasText,
      criteria: view.criteria,
      overallScore: view.overallScore,
      grade: view.grade,
      matched: skillAnalysis.matched,
      missing: skillAnalysis.missing,
      extra: skillAnalysis.extra,
      matchPct: parsedCv.hasText ? cvComparison.matchPct : Math.round((skillAnalysis.matched.length / Math.max(1, view.requiredSkills.length)) * 100),
      requiredCount: view.requiredSkills.length,
      totalYears: parsedCv.totalYears,
      topSkill: topSkill
        ? { name: topSkill.name, years: toNumber(topSkill.years), level: topSkill.level }
        : null,
      education: parsedCv.education,
      languages: parsedCv.languages,
      certifications: parsedCv.certifications,
      aiStrengths: application?.aiResult?.strengths?.length ? application.aiResult.strengths : [],
      aiConcerns: application?.aiResult?.concerns?.length ? application.aiResult.concerns : []
    });
  }, [application?.aiResult, parsedCv, cvComparison.matchPct, skillAnalysis, view]);

  const hrSuggestion = useMemo(
    () =>
      buildHrSuggestion({
        overallScore: view.overallScore,
        matchPct: parsedCv.hasText
          ? cvComparison.matchPct
          : Math.round((skillAnalysis.matched.length / Math.max(1, view.requiredSkills.length)) * 100),
        missingCount: skillAnalysis.missing.length,
        requiredCount: view.requiredSkills.length,
        concernsCount: detailedEvaluation.concerns.length
      }),
    [view.overallScore, view.requiredSkills.length, parsedCv.hasText, cvComparison.matchPct, skillAnalysis, detailedEvaluation.concerns.length]
  );

  async function triggerRescreen() {
    if (!token || !application?.id) return;
    setRescreening(true);
    const res = await apiFetch(`/applications/${application.id}/rescreen`, { method: "POST", token });
    setRescreening(false);
    if (res.ok) {
      toast.success("Đã gửi yêu cầu chấm lại bằng AI.");
    } else {
      toast.error(res.error ?? "Không gửi được yêu cầu chấm lại.");
    }
    void loadApplication();
  }

  async function submitStatus(nextStatus: ApplicationStatus, fallbackNote: string) {
    if (!token || !application?.id) return;
    setHrActionLoading(nextStatus);
    const note = hrNote.trim() || fallbackNote;
    const res = await apiFetch<Application>(`/applications/${application.id}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status: nextStatus, note })
    });
    setHrActionLoading(null);
    if (!res.ok || !res.data) {
      toast.error(res.error ?? "Không cập nhật được trạng thái ứng tuyển.");
      return;
    }
    setApplication(res.data);
    setHrNote("");
    toast.success(`Đã chuyển sang "${statusLabel(nextStatus)}" và gửi thông báo cho ứng viên.`);
    void loadApplication();
  }

  async function submitInterview() {
    if (!token || !application?.id) return;
    if (!interviewAt) {
      toast.error("Vui lòng chọn thời gian phỏng vấn.");
      return;
    }
    setHrActionLoading("INTERVIEW");
    const res = await apiFetch<Application>(`/applications/${application.id}/schedule-interview`, {
      method: "POST",
      token,
      body: JSON.stringify({
        interviewAt: new Date(interviewAt).toISOString(),
        note: hrNote.trim() || hrSuggestion.note
      })
    });
    setHrActionLoading(null);
    if (!res.ok || !res.data) {
      toast.error(res.error ?? "Không đặt được lịch phỏng vấn.");
      return;
    }
    setApplication(res.data);
    setHrNote("");
    setInterviewAt("");
    toast.success("Đã đặt lịch phỏng vấn và gửi thông báo cho ứng viên.");
    void loadApplication();
  }

  async function submitOffer() {
    if (!token || !application?.id) return;
    const salaryRaw = offerForm.salaryAmount.trim();
    const salaryAmount = salaryRaw ? Number(salaryRaw.replace(/[^\d]/g, "")) : undefined;
    if (salaryRaw && (salaryAmount === undefined || Number.isNaN(salaryAmount))) {
      toast.error("Mức lương không hợp lệ.");
      return;
    }
    setOfferLoading(true);
    const res = await apiFetch<Application>(`/applications/${application.id}/offer`, {
      method: "POST",
      token,
      body: JSON.stringify({
        salaryAmount,
        startDate: offerForm.startDate ? new Date(offerForm.startDate).toISOString() : undefined,
        responseDeadline: offerForm.responseDeadline
          ? new Date(offerForm.responseDeadline).toISOString()
          : undefined,
        offerLetterUrl: offerForm.offerLetterUrl.trim() || undefined,
        note: offerForm.note.trim() || undefined
      })
    });
    setOfferLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Không gửi được offer.");
      return;
    }
    toast.success("Đã gửi offer và thông báo cho ứng viên.");
    void loadApplication();
  }

  if (loading) return <LoadingBlock label="Đang tải chi tiết AI Score..." />;
  if (error) return <ErrorBlock message={error} onRetry={() => { setLoading(true); void loadApplication(); }} />;

  const scorePct = Math.max(0, Math.min(100, view.overallScore));
  const canRescreen = user?.role === "RECRUITER" || user?.role === "ADMIN";
  const canManageApplication = user?.role === "RECRUITER" || user?.role === "ADMIN";
  const ringCircumference = 414;
  const ringOffset = ringCircumference - (ringCircumference * scorePct) / 100;
  const backHref = user?.role === "RECRUITER" || user?.role === "ADMIN" ? "/recruiter/dashboard" : "/applications";

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center text-sm font-semibold text-body hover:text-ink-deep">
        <ChevronLeft size={16} className="mr-1" /> Quay lại danh sách
      </Link>

      <AnimatedContent>
        <PageHeader
          title={view.jobTitle}
          description={`${view.company} · ${view.location}`}
          actions={
            <>
              <a href={view.cvFileUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" leftIcon={<FileText size={16} />}>Xem CV</Button>
              </a>
              {canRescreen ? (
                <Button variant="tertiary" leftIcon={<Sparkles size={16} />} isLoading={rescreening} onClick={() => void triggerRescreen()}>
                  Chấm lại bằng AI
                </Button>
              ) : null}
              {application?.status ? <StatusBadge status={application.status} /> : null}
            </>
          }
        />
      </AnimatedContent>

      <div className="grid gap-6 xl:grid-cols-2">
        <AnimatedContent delay={0.05} direction="horizontal">
          <Card className="space-y-5">
            <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
              <div className="rounded-xl border border-ink/10 bg-canvas-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Tổng quan điểm</p>
                <div className="mt-4 flex items-center justify-center">
                  <div className="relative h-40 w-40">
                    <svg className="h-40 w-40 -rotate-90">
                      <circle cx="80" cy="80" r="66" strokeWidth="14" className="stroke-ink/10 fill-none" />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="66"
                        strokeWidth="14"
                        className="fill-none stroke-emerald-500"
                        strokeDasharray={ringCircumference}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: prefersReducedMotion ? ringOffset : ringCircumference }}
                        animate={{ strokeDashoffset: ringOffset }}
                        transition={{ duration: 1.3, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-4xl font-black text-ink">
                        <CountUp to={view.overallScore} decimals={1} />
                      </p>
                      <p className="text-xs font-semibold text-body">/100</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 18 }}
                    className={`rounded-pill border px-4 py-1.5 text-sm font-bold ${gradeTone(view.grade)}`}
                  >
                    Xếp loại {view.grade}
                  </motion.span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-ink">Công thức trọng số</p>
                <p className="rounded-lg bg-canvas-soft p-3 text-sm text-body">Tổng điểm = Kỹ năng 40% + Kinh nghiệm 30% + Học vấn 20% + Khác 10%</p>
                <p className="flex items-center gap-2 text-xs text-body">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-green" />
                  Xử lý trong {view.processingTimeMs}ms
                </p>
                <p className="rounded-lg border border-ink/10 bg-canvas p-3 text-sm text-body">{view.explanation}</p>
              </div>
            </div>
          </Card>
        </AnimatedContent>

        <AnimatedContent delay={0.1} direction="horizontal">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Phân tích tiêu chí</h2>
              <Badge tone="primary">Có mốc tham chiếu</Badge>
            </div>
            {view.criteria.map((item, idx) => {
              const contribution = (item.score * item.weight) / 100;
              return (
                <div key={item.key} className="space-y-2 rounded-xl bg-canvas-soft p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <p className="font-semibold text-ink">{item.label}</p>
                    <div className="flex items-center gap-2">
                      <span className="rounded-pill bg-canvas px-2 py-1 text-xs font-semibold text-body">Trọng số {item.weight}%</span>
                      <span className="text-sm font-bold text-ink">
                        <CountUp to={item.score} decimals={1} />
                      </span>
                      <span className="text-xs font-semibold text-body">Đóng góp {contribution.toFixed(1)} điểm</span>
                    </div>
                  </div>
                  <div className="relative h-3 rounded-full bg-surface-elevated">
                    <motion.div
                      className="h-3 rounded-full bg-accent-green"
                      initial={{ width: prefersReducedMotion ? `${item.score}%` : 0 }}
                      whileInView={{ width: `${item.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.15 + idx * 0.12, ease: "easeOut" }}
                    />
                    <span className="absolute -top-1 h-5 w-0.5 bg-accent-yellow" style={{ left: `${item.benchmark}%` }} />
                  </div>
                  <p className="text-xs text-body">Mốc tham chiếu: {item.benchmark}</p>
                </div>
              );
            })}
          </Card>
        </AnimatedContent>
      </div>

      {canManageApplication ? (
        <AnimatedContent delay={0.05}>
          <Card className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Tự động hóa HR</p>
                <h2 className="mt-1 text-lg font-bold text-ink">Gợi ý hành động cho HR</h2>
                <p className="mt-1 text-sm text-body">
                  Hệ thống đề xuất bước tiếp theo từ điểm AI, mức khớp JD và các rủi ro. HR xác nhận trước khi cập nhật trạng thái.
                </p>
              </div>
              <Badge
                tone={
                  hrSuggestion.tone === "positive"
                    ? "positive"
                    : hrSuggestion.tone === "negative"
                      ? "negative"
                      : "warning"
                }
              >
                {hrSuggestion.title}
              </Badge>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                hrSuggestion.tone === "positive"
                  ? "border-hairline-strong bg-accent-green-glow"
                  : hrSuggestion.tone === "negative"
                    ? "border-hairline-strong bg-accent-red-glow"
                    : "border-hairline-strong bg-accent-yellow-glow"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  hrSuggestion.tone === "positive"
                    ? "text-positive"
                    : hrSuggestion.tone === "negative"
                      ? "text-negative"
                      : "text-warning"
                }`}
              >
                {hrSuggestion.title}
              </p>
              <p className="mt-1 text-sm text-ink">{hrSuggestion.body}</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-3 rounded-xl bg-canvas-soft p-4">
                <FieldLabel label="Ghi chú cho lịch sử và thông báo ứng viên">
                  <Textarea
                    value={hrNote}
                    onChange={(event) => setHrNote(event.target.value)}
                    placeholder={hrSuggestion.note}
                    maxLength={500}
                  />
                </FieldLabel>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    isLoading={hrActionLoading === hrSuggestion.status}
                    onClick={() => void submitStatus(hrSuggestion.status, hrSuggestion.note)}
                  >
                    Xác nhận gợi ý
                  </Button>
                  <Button
                    variant="secondary"
                    isLoading={hrActionLoading === "HR_REVIEW"}
                    onClick={() => void submitStatus("HR_REVIEW", "HR giữ hồ sơ ở trạng thái review thêm.")}
                  >
                    Giữ HR Review
                  </Button>
                  <Button
                    variant="secondary"
                    isLoading={hrActionLoading === "HIRED"}
                    onClick={() => void submitStatus("HIRED", "HR xác nhận ứng viên đã được tuyển.")}
                  >
                    Đã tuyển
                  </Button>
                  <Button
                    variant="secondary"
                    isLoading={hrActionLoading === "REJECTED"}
                    onClick={() => void submitStatus("REJECTED", "HR xác nhận hồ sơ chưa phù hợp ở thời điểm hiện tại.")}
                  >
                    Từ chối
                  </Button>
                </div>
              </div>

              <div className="space-y-3 rounded-xl bg-canvas-soft p-4">
                <FieldLabel label="Đặt lịch phỏng vấn">
                  <Input
                    type="datetime-local"
                    value={interviewAt}
                    onChange={(event) => setInterviewAt(event.target.value)}
                  />
                </FieldLabel>
                <p className="text-xs text-body">
                  Khi xác nhận lịch, trạng thái sẽ chuyển sang {statusLabel("INTERVIEW")} và ứng viên nhận thông báo tự động.
                </p>
                <Button
                  variant="primary"
                  isLoading={hrActionLoading === "INTERVIEW"}
                  onClick={() => void submitInterview()}
                >
                  Mời phỏng vấn
                </Button>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-hairline-strong bg-canvas-soft p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-body">Đề nghị nhận việc</p>
                  <h3 className="mt-0.5 text-base font-bold text-ink">Gửi offer cho ứng viên</h3>
                </div>
                {application?.offer ? (
                  <Badge
                    tone={
                      application.offer.status === "ACCEPTED"
                        ? "positive"
                        : application.offer.status === "DECLINED"
                          ? "negative"
                          : "warning"
                    }
                  >
                    {offerStatusLabel(application.offer.status)}
                  </Badge>
                ) : null}
              </div>

              {application?.offer ? (
                <p className="text-xs text-body">
                  Offer hiện tại: {formatAmount(application.offer.salaryAmount, application.offer.salaryCurrency)}
                  {application.offer.responseDeadline
                    ? ` · phản hồi trước ${formatDate(application.offer.responseDeadline)}`
                    : ""}
                  {application.offer.respondedAt
                    ? ` · ứng viên đã phản hồi ${formatDateTime(application.offer.respondedAt)}`
                    : ""}
                  . Gửi lại sẽ cập nhật offer và đặt lại trạng thái chờ phản hồi.
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <FieldLabel label="Mức lương (VND/tháng)">
                  <Input
                    inputMode="numeric"
                    placeholder="VD: 25000000"
                    value={offerForm.salaryAmount}
                    onChange={(event) => setOfferForm((prev) => ({ ...prev, salaryAmount: event.target.value }))}
                  />
                </FieldLabel>
                <FieldLabel label="Ngày bắt đầu dự kiến">
                  <Input
                    type="date"
                    value={offerForm.startDate}
                    onChange={(event) => setOfferForm((prev) => ({ ...prev, startDate: event.target.value }))}
                  />
                </FieldLabel>
                <FieldLabel label="Hạn phản hồi">
                  <Input
                    type="date"
                    value={offerForm.responseDeadline}
                    onChange={(event) => setOfferForm((prev) => ({ ...prev, responseDeadline: event.target.value }))}
                  />
                </FieldLabel>
                <FieldLabel label="Link offer letter (tùy chọn)">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={offerForm.offerLetterUrl}
                    onChange={(event) => setOfferForm((prev) => ({ ...prev, offerLetterUrl: event.target.value }))}
                  />
                </FieldLabel>
              </div>
              <FieldLabel label="Ghi chú offer (gửi kèm thông báo cho ứng viên)">
                <Textarea
                  value={offerForm.note}
                  onChange={(event) => setOfferForm((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder="Phúc lợi, lộ trình, thông tin liên hệ HR..."
                  maxLength={2000}
                />
              </FieldLabel>
              <Button variant="primary" isLoading={offerLoading} onClick={() => void submitOffer()}>
                {application?.offer ? "Cập nhật & gửi lại offer" : "Gửi offer"}
              </Button>
            </div>
          </Card>
        </AnimatedContent>
      ) : null}

      <AnimatedContent delay={0.05}>
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">Lịch sử trạng thái</h2>
            {application?.status ? <Badge tone="primary">Hiện tại: {statusLabel(application.status)}</Badge> : null}
          </div>
          {application?.statusHistory?.length ? (
            <div className="space-y-3">
              {application.statusHistory.map((item, idx) => (
                <motion.div
                  key={`${item.changedAt}-${item.toStatus}-${idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                  className="rounded-xl border border-ink/10 bg-canvas-soft p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">
                      {item.fromStatus ? `${statusLabel(item.fromStatus)} → ` : ""}{statusLabel(item.toStatus)}
                    </p>
                    <span className="text-xs font-semibold text-body">{formatDateTime(item.changedAt)}</span>
                  </div>
                  {item.note ? <p className="mt-2 text-sm text-body">{item.note}</p> : null}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-canvas-soft p-3 text-sm text-body">Chưa có lịch sử thay đổi trạng thái.</p>
          )}
        </Card>
      </AnimatedContent>

      <div className="grid gap-6 xl:grid-cols-2">
        <AnimatedContent delay={0.05} direction="horizontal">
          <Card className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><UserCircle2 size={18} /> Hồ sơ ứng viên</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-canvas-soft p-3"><p className="text-xs text-body">Họ tên</p><p className="font-semibold text-ink">{view.candidateName}</p></div>
              <div className="rounded-lg bg-canvas-soft p-3"><p className="text-xs text-body flex items-center gap-1"><Mail size={12} /> Email</p><p className="font-semibold text-ink break-all">{view.candidateEmail}</p></div>
              <div className="rounded-lg bg-canvas-soft p-3"><p className="text-xs text-body">Chức danh</p><p className="font-semibold text-ink">{view.headline}</p></div>
              <div className="rounded-lg bg-canvas-soft p-3"><p className="text-xs text-body flex items-center gap-1"><MapPin size={12} /> Địa điểm</p><p className="font-semibold text-ink">{view.location}</p></div>
            </div>
            <p className="rounded-lg bg-canvas-soft p-3 text-sm text-body">{view.bio}</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-pill bg-canvas-soft px-3 py-1 text-xs font-semibold text-ink">{view.cvFileName}</span>
              <span className="rounded-pill bg-canvas-soft px-3 py-1 text-xs font-semibold text-ink">Thư giới thiệu</span>
            </div>
            <p className="rounded-lg border border-ink/10 bg-canvas p-3 text-sm text-body">{view.coverLetter}</p>
          </Card>
        </AnimatedContent>

        <AnimatedContent delay={0.1} direction="horizontal">
          <Card className="space-y-4">
            <h2 className="text-lg font-bold text-ink">Mức độ phù hợp JD</h2>
            <div className="rounded-lg bg-canvas-soft p-3 text-sm">
              <p className="font-semibold text-ink">{view.jobTitle}</p>
              <p className="text-body">{view.company}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {view.requiredSkills.map((skill) => {
                const matched = skillAnalysis.matched.some((s) => s.toLowerCase() === skill.toLowerCase());
                const missing = skillAnalysis.missing.some((s) => s.toLowerCase() === skill.toLowerCase());
                return (
                  <span key={skill} className={`rounded-full px-3 py-1 text-xs font-medium ${matched ? "bg-accent-green-glow text-positive" : missing ? "bg-accent-red-glow text-negative" : "bg-surface-elevated text-ink"}`}>
                    {skill}
                  </span>
                );
              })}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-accent-green-glow border border-hairline-strong p-3 text-center"><p className="text-xs text-positive">Phù hợp</p><p className="text-2xl font-bold text-positive"><CountUp to={skillAnalysis.matched.length} /></p></div>
              <div className="rounded-lg bg-accent-red-glow border border-hairline-strong p-3 text-center"><p className="text-xs text-negative">Còn thiếu</p><p className="text-2xl font-bold text-negative"><CountUp to={skillAnalysis.missing.length} /></p></div>
              <div className="rounded-lg bg-surface-elevated border border-hairline-strong p-3 text-center"><p className="text-xs text-ink">Tổng kỹ năng</p><p className="text-2xl font-bold text-ink"><CountUp to={view.skills.length} /></p></div>
            </div>
          </Card>
        </AnimatedContent>
      </div>

      <AnimatedContent delay={0.05}>
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><FileSearch size={18} /> Thông tin đọc được từ CV</h2>
            <Badge tone={parsedCv.hasText ? "primary" : "default"}>{parsedCv.hasText ? "Đã đọc được nội dung CV" : "Chưa đọc được nội dung"}</Badge>
          </div>

          {parsedCv.hasText ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-canvas-soft p-3"><p className="text-xs text-body flex items-center gap-1"><Mail size={12} /> Email</p><p className="font-semibold text-ink break-all">{parsedCv.contact.email ?? "Không tìm thấy"}</p></div>
                <div className="rounded-lg bg-canvas-soft p-3"><p className="text-xs text-body flex items-center gap-1"><Phone size={12} /> Số điện thoại</p><p className="font-semibold text-ink">{parsedCv.contact.phone ?? "Không tìm thấy"}</p></div>
                <div className="rounded-lg bg-canvas-soft p-3"><p className="text-xs text-body">Số năm kinh nghiệm</p><p className="text-2xl font-black text-ink"><CountUp to={parsedCv.totalYears} decimals={parsedCv.totalYears % 1 === 0 ? 0 : 1} /> năm</p></div>
              </div>

              {parsedCv.contact.links.length ? (
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink"><Link2 size={16} /> Liên kết</p>
                  <div className="flex flex-wrap gap-2">
                    {parsedCv.contact.links.map((link) => (
                      <a key={link} href={link.startsWith("http") ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-accent-blue-glow px-3 py-1 text-xs font-medium text-link hover:bg-surface-elevated">{link}</a>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Kỹ năng nhận diện trong CV ({parsedCv.skills.length})</p>
                {parsedCv.skills.length ? (
                  <div className="flex flex-wrap gap-2">
                    {parsedCv.skills.map((skill, idx) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.04, duration: 0.25 }}
                        className="rounded-full bg-accent-green-glow px-3 py-1 text-xs font-medium text-positive"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                ) : <p className="text-sm text-body">Không nhận diện được kỹ năng nào trong nội dung CV.</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink"><GraduationCap size={16} /> Học vấn</p>
                  {parsedCv.education.length ? (
                    <ul className="space-y-1 text-sm text-body">{parsedCv.education.map((line) => <li key={line} className="rounded-lg bg-canvas-soft p-2">{line}</li>)}</ul>
                  ) : <p className="text-sm text-body">Không tìm thấy.</p>}
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink"><Award size={16} /> Chứng chỉ</p>
                  {parsedCv.certifications.length ? (
                    <ul className="space-y-1 text-sm text-body">{parsedCv.certifications.map((line) => <li key={line} className="rounded-lg bg-canvas-soft p-2">{line}</li>)}</ul>
                  ) : <p className="text-sm text-body">Không tìm thấy.</p>}
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink"><Languages size={16} /> Ngôn ngữ</p>
                  {parsedCv.languages.length ? (
                    <div className="flex flex-wrap gap-2">{parsedCv.languages.map((lang) => <span key={lang} className="rounded-pill bg-canvas-soft px-3 py-1 text-xs font-semibold text-ink">{lang}</span>)}</div>
                  ) : <p className="text-sm text-body">Không tìm thấy.</p>}
                </div>
              </div>
            </>
          ) : (
            <p className="rounded-lg border border-hairline-strong bg-accent-yellow-glow p-3 text-sm text-warning">
              Chưa đọc được nội dung từ file CV này (có thể CV được tải lên trước khi bật tính năng đọc nội dung, hoặc là file ảnh/scan). Các phần bên dưới hiển thị theo hồ sơ ứng viên. Recruiter có thể bấm &quot;Chấm lại bằng AI&quot; sau khi ứng viên tải lại CV.
            </p>
          )}
        </Card>
      </AnimatedContent>

      <AnimatedContent delay={0.05}>
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">So khớp CV với mô tả công việc</h2>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${cvComparison.matchPct >= 70 ? "bg-accent-green-glow text-positive" : cvComparison.matchPct >= 40 ? "bg-accent-yellow-glow text-warning" : "bg-accent-red-glow text-negative"}`}>
              <CountUp to={cvComparison.matchPct} suffix="%" /> phù hợp
            </span>
          </div>

          <div className="relative h-3 rounded-full bg-surface-elevated">
            <motion.div
              className={`h-3 rounded-full ${cvComparison.matchPct >= 70 ? "bg-accent-green" : cvComparison.matchPct >= 40 ? "bg-accent-yellow" : "bg-accent-red"}`}
              initial={{ width: prefersReducedMotion ? `${cvComparison.matchPct}%` : 0 }}
              whileInView={{ width: `${cvComparison.matchPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-body">Đối chiếu trực tiếp với nội dung CV: tìm thấy {cvComparison.matched.length}/{view.requiredSkills.length} kỹ năng yêu cầu.</p>

          <div className="space-y-2">
            {view.requiredSkills.map((skill, idx) => {
              const matched = cvComparison.matched.some((s) => s.toLowerCase() === skill.toLowerCase());
              return (
                <motion.div
                  key={skill}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className="flex items-center justify-between gap-3 rounded-lg bg-canvas-soft px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-ink">{skill}</span>
                  {matched ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-positive"><CheckCircle2 size={14} /> Có trong CV</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-negative"><XCircle size={14} /> Không thấy</span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {cvComparison.extra.length ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Kỹ năng khác có trong CV (ngoài yêu cầu)</p>
              <div className="flex flex-wrap gap-2">{cvComparison.extra.map((skill) => <span key={skill} className="rounded-full bg-accent-blue-glow px-3 py-1 text-xs font-medium text-link">{skill}</span>)}</div>
            </div>
          ) : null}
        </Card>
      </AnimatedContent>

      {parsedCv.hasText ? (
        <AnimatedContent delay={0.05}>
          <Card className="space-y-3">
            <button
              type="button"
              onClick={() => setShowRawCv((prev) => !prev)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="flex items-center gap-2 text-lg font-bold text-ink"><FileText size={18} /> Nội dung CV gốc</span>
              <motion.span animate={{ rotate: showRawCv ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-body">
                <ChevronDown size={20} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {showRawCv ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-ink/10 bg-canvas-soft p-4 text-xs leading-relaxed text-body">
                    {cvText}
                  </pre>
                </motion.div>
              ) : null}
            </AnimatePresence>
            {!showRawCv ? <p className="text-xs text-body">Bấm để xem toàn bộ nội dung văn bản đã trích xuất từ file CV.</p> : null}
          </Card>
        </AnimatedContent>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <AnimatedContent delay={0.05} direction="horizontal">
          <Card className="space-y-4">
            <h2 className="text-lg font-bold text-ink">Bảng kỹ năng</h2>
            <div className="overflow-x-auto rounded-xl border border-ink/10">
              <table className="min-w-full text-sm">
                <thead className="bg-canvas-soft text-left text-body">
                  <tr>
                    <th className="px-3 py-2">Kỹ năng</th>
                    <th className="px-3 py-2">Số năm</th>
                    <th className="px-3 py-2">Cấp độ</th>
                  </tr>
                </thead>
                <tbody>
                  {view.skills.map((skill, idx) => (
                    <motion.tr
                      key={skill.name}
                      className="border-t border-ink/10"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.06, duration: 0.3 }}
                    >
                      <td className="px-3 py-2 font-semibold text-ink">{skill.name}</td>
                      <td className="px-3 py-2 text-body">{skill.years}</td>
                      <td className="px-3 py-2"><span className={`rounded-pill px-2 py-1 text-xs font-semibold ${levelTone(skill.level)}`}>{levelLabel(skill.level)}</span></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </AnimatedContent>

        <AnimatedContent delay={0.1} direction="horizontal">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-ink">Phân tích kỹ năng</h2>
              <Badge tone={skillAnalysis.fromCv ? "primary" : "default"}>
                {skillAnalysis.fromCv ? "Đối chiếu từ nội dung CV" : "Theo hồ sơ khai báo"}
              </Badge>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-positive"><CheckCircle2 size={16} /> Kỹ năng phù hợp ({skillAnalysis.matched.length})</p>
              {skillAnalysis.matched.length ? (
                <div className="flex flex-wrap gap-2">{skillAnalysis.matched.map((skill) => <span key={skill} className="rounded-full bg-accent-green-glow px-3 py-1 text-xs font-medium text-positive">{skill}</span>)}</div>
              ) : (
                <p className="text-sm text-body">Chưa tìm thấy kỹ năng yêu cầu nào khớp với CV.</p>
              )}
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-negative"><AlertTriangle size={16} /> Kỹ năng còn thiếu ({skillAnalysis.missing.length})</p>
              {skillAnalysis.missing.length ? (
                <div className="flex flex-wrap gap-2">{skillAnalysis.missing.map((skill) => <span key={skill} className="rounded-full bg-accent-red-glow px-3 py-1 text-xs font-medium text-negative">{skill}</span>)}</div>
              ) : (
                <p className="text-sm text-positive">Đáp ứng đầy đủ các kỹ năng yêu cầu trong JD.</p>
              )}
            </div>
            {skillAnalysis.extra.length ? (
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-link"><Sparkles size={16} /> Kỹ năng cộng thêm ({skillAnalysis.extra.length})</p>
                <div className="flex flex-wrap gap-2">{skillAnalysis.extra.map((skill) => <span key={skill} className="rounded-full bg-accent-blue-glow px-3 py-1 text-xs font-medium text-link">{skill}</span>)}</div>
              </div>
            ) : null}
            {skillAnalysis.fromCv ? (
              <p className="text-xs text-body">Kết quả đối chiếu trực tiếp với văn bản trích xuất từ file CV, đảm bảo khớp với nội dung thực tế.</p>
            ) : null}
          </Card>
        </AnimatedContent>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AnimatedContent delay={0.05} direction="horizontal">
          <Card className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><BriefcaseBusiness size={18} /> Kinh nghiệm</h2>
            {view.experiences.map((exp) => (
              <div key={exp.id} className="rounded-xl bg-canvas-soft p-4">
                <p className="font-semibold text-ink">{exp.position}</p>
                <p className="text-sm text-body">{exp.company}</p>
                <p className="text-xs text-body mt-1">{formatExperienceRange(exp.startDate, exp.endDate, exp.isCurrent)}</p>
                {exp.description ? <p className="mt-2 text-sm text-body">{exp.description}</p> : null}
              </div>
            ))}
          </Card>
        </AnimatedContent>

        <AnimatedContent delay={0.1} direction="horizontal">
          <Card className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><GraduationCap size={18} /> Học vấn</h2>
            {view.educations.map((edu) => (
              <div key={edu.id} className="rounded-xl bg-canvas-soft p-4">
                <p className="font-semibold text-ink">{edu.school}</p>
                <p className="text-sm text-body">{edu.degree}{edu.major ? ` · ${edu.major}` : ""}</p>
                <p className="text-xs text-body mt-1">{edu.startYear ?? "—"} - {edu.endYear ?? "Hiện tại"}{edu.gpa ? ` · GPA ${edu.gpa}` : ""}</p>
              </div>
            ))}
          </Card>
        </AnimatedContent>
      </div>

      <AnimatedContent delay={0.05}>
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">Đánh giá chi tiết</h2>
            <div className="flex items-center gap-2">
              <Badge tone="primary">{detailedEvaluation.strengths.length} điểm mạnh</Badge>
              <Badge tone="warning">{detailedEvaluation.concerns.length} lưu ý</Badge>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-xl bg-accent-green-glow border border-hairline-strong p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-positive"><CheckCircle2 size={16} /> Điểm mạnh</p>
              <ul className="space-y-2 text-sm text-ink">
                {detailedEvaluation.strengths.map((item, idx) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    className="flex gap-2"
                  >
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-positive" /><span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-accent-yellow-glow border border-hairline-strong p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-warning"><AlertTriangle size={16} /> Lưu ý &amp; rủi ro</p>
              {detailedEvaluation.concerns.length ? (
                <ul className="space-y-2 text-sm text-ink">
                  {detailedEvaluation.concerns.map((item, idx) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      className="flex gap-2"
                    >
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" /><span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 text-sm text-positive"><CheckCircle2 size={16} /> Không phát hiện rủi ro đáng kể trong vòng sàng lọc tự động.</p>
              )}
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 ${
              detailedEvaluation.recommendationTone === "positive"
                ? "border-hairline-strong bg-accent-green-glow"
                : detailedEvaluation.recommendationTone === "neutral"
                  ? "border-hairline-strong bg-accent-blue-glow"
                  : "border-hairline-strong bg-accent-red-glow"
            }`}
          >
            <p
              className={`mb-1 flex items-center gap-2 text-sm font-medium ${
                detailedEvaluation.recommendationTone === "positive"
                  ? "text-positive"
                  : detailedEvaluation.recommendationTone === "neutral"
                    ? "text-link"
                    : "text-negative"
              }`}
            >
              <Sparkles size={16} /> Khuyến nghị
            </p>
            <p className="text-sm text-ink">{detailedEvaluation.recommendation}</p>
          </div>

          <p className="rounded-lg border border-ink/10 bg-canvas-soft p-3 text-xs text-body">
            Lưu ý: Kết quả AI chỉ hỗ trợ sàng lọc ban đầu và không thay thế quyết định tuyển dụng cuối cùng của HR.
          </p>
        </Card>
      </AnimatedContent>

      <div className="flex justify-end">
        <a href={view.cvFileUrl} target="_blank" rel="noopener noreferrer">
          <Button leftIcon={<Download size={16} />}>Tải CV</Button>
        </a>
      </div>
    </div>
  );
}
