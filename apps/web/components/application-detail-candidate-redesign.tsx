"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, CalendarClock, CheckCircle2, FileText, Lightbulb, Loader2, MapPin, PartyPopper, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api-client";
import { Application } from "../lib/types";
import { formatAmount, formatDate, formatDateTime, formatSalary, formatScore, offerStatusLabel, statusLabel } from "../lib/format";
import { Badge, StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, PageHeader } from "./ui/card";
import { FieldLabel, Textarea } from "./ui/input";
import { ErrorBlock, LoadingBlock } from "./ui/states";

type PipelineStep = {
  key: "APPLIED" | "AI_SCREENING" | "HR_REVIEW" | "RESULT";
  label: string;
  description: string;
};

const pipelineSteps: PipelineStep[] = [
  { key: "APPLIED", label: "Applied", description: "Hồ sơ đã được gửi thành công." },
  { key: "AI_SCREENING", label: "AI Screening", description: "Hệ thống AI đang phân tích độ phù hợp." },
  { key: "HR_REVIEW", label: "HR Review", description: "Recruiter đang xem xét kết quả." },
  { key: "RESULT", label: "Result", description: "Kết quả tuyển dụng sẽ được cập nhật." }
];

const fallbackApplication = {
  id: "demo-application",
  status: "HR_REVIEW",
  appliedAt: "2026-06-01T09:30:00.000Z",
  coverLetter:
    "I am excited to apply for Backend Engineer at TechNova Vietnam. I have strong hands-on experience with Node.js, TypeScript, PostgreSQL, and distributed backend systems for B2B SaaS products.",
  job: {
    title: "Backend Engineer",
    location: "Ho Chi Minh City",
    jobType: "Full-time",
    minSalary: 1800,
    maxSalary: 2500,
    company: { name: "TechNova Vietnam" }
  },
  aiResult: {
    overallScore: 58,
    skillScore: 64,
    experienceScore: 55,
    educationScore: 52,
    otherScore: 49,
    grade: "C"
  },
  candidate: {
    email: "linh.nguyen@example.com",
    profile: { fullName: "Linh Nguyen" }
  },
  statusHistory: [
    { id: "h3", fromStatus: "AI_SCREENING", toStatus: "HR_REVIEW", changedAt: "2026-06-02T15:20:00.000Z", note: "Recruiter queue created." },
    { id: "h2", fromStatus: "APPLIED", toStatus: "AI_SCREENING", changedAt: "2026-06-02T14:05:00.000Z", note: "AI parser started processing CV." },
    { id: "h1", fromStatus: "APPLIED", toStatus: "APPLIED", changedAt: "2026-06-01T09:30:00.000Z", note: "Application submitted by candidate." }
  ]
} as const;

function stageIndex(status: string) {
  if (status === "APPLIED") return 0;
  if (status === "AI_SCREENING") return 1;
  if (status === "HR_REVIEW") return 2;
  return 3;
}

function timelineState(step: number, active: number): "done" | "active" | "pending" {
  if (step < active) return "done";
  if (step === active) return "active";
  return "pending";
}

function timelineDotClass(state: "done" | "active" | "pending") {
  if (state === "done") return "bg-positive border-positive";
  if (state === "active") return "bg-link border-link";
  return "bg-surface-elevated border-hairline-strong";
}

function stepTextClass(state: "done" | "active" | "pending") {
  if (state === "done") return "text-positive";
  if (state === "active") return "text-link";
  return "text-mute";
}

function scoreGrade(score: number, grade?: string | null) {
  if (grade) return grade;
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

function gradeClass(grade: string) {
  if (grade.startsWith("A")) return "bg-accent-green-glow text-positive";
  if (grade.startsWith("B")) return "bg-accent-blue-glow text-link";
  if (grade.startsWith("C")) return "bg-accent-yellow-glow text-warning";
  return "bg-accent-red-glow text-negative";
}

function estimateLabel(status: string) {
  if (status === "APPLIED") return "~1-2 giờ để bắt đầu AI screening";
  if (status === "AI_SCREENING") return "~5-15 phút để có điểm AI";
  if (status === "HR_REVIEW") return "~1-3 ngày làm việc để HR phản hồi";
  return "Kết quả cuối đang được cập nhật";
}

export function ApplicationDetailCandidateRedesign() {
  const params = useParams<{ id: string }>();
  const { token } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [offerActionLoading, setOfferActionLoading] = useState<"accept" | "decline" | null>(null);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const loadApplication = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch<Application>(`/applications/${params.id}`, { token });
    if (!res.ok) {
      setError(res.error ?? "Không thể tải đơn ứng tuyển");
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
    const source = application ?? (fallbackApplication as unknown as Application);
    const score = Number(source.aiResult?.overallScore ?? fallbackApplication.aiResult.overallScore);
    const grade = scoreGrade(score, source.aiResult?.grade);
    const currentStage = stageIndex(source.status ?? fallbackApplication.status);
    const latestChangedAt =
      source.statusHistory?.[0]?.changedAt ??
      source.appliedAt ??
      fallbackApplication.statusHistory[0].changedAt;

    return {
      source,
      score,
      grade,
      currentStage,
      latestChangedAt
    };
  }, [application]);

  async function refreshStatus() {
    setRefreshing(true);
    await loadApplication();
    setRefreshing(false);
  }

  async function respondOffer(action: "accept" | "decline") {
    if (!token || !application?.id) return;
    setOfferActionLoading(action);
    const res = await apiFetch(`/applications/${application.id}/offer/respond`, {
      method: "POST",
      token,
      body: JSON.stringify({
        action,
        reason: action === "decline" ? declineReason.trim() || undefined : undefined
      })
    });
    setOfferActionLoading(null);
    if (!res.ok) {
      toast.error(res.error ?? "Không gửi được phản hồi offer.");
      return;
    }
    toast.success(action === "accept" ? "Bạn đã chấp nhận offer. Chúc mừng!" : "Bạn đã từ chối offer.");
    setShowDecline(false);
    setDeclineReason("");
    void loadApplication();
  }

  if (loading) return <LoadingBlock label="Đang tải trạng thái ứng tuyển..." />;
  if (error && !application) return <ErrorBlock message={error} />;

  const status = view.source.status ?? fallbackApplication.status;
  const scorePct = Math.max(0, Math.min(100, view.score));

  return (
    <div className="space-y-6">
      <PageHeader
        title={view.source.job?.title ?? fallbackApplication.job.title}
        description={`${view.source.job?.company?.name ?? fallbackApplication.job.company.name} · ${view.source.job?.location ?? fallbackApplication.job.location} · Nộp ${formatDate(view.source.appliedAt)}`}
        actions={
          <>
            <Button variant="secondary" leftIcon={refreshing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} onClick={() => void refreshStatus()}>
              AI Screening
            </Button>
            <Link href={`/ai-score/${view.source.id}`}>
              <Button leftIcon={<Bot size={16} />}>AI Score</Button>
            </Link>
          </>
        }
      />

      <Card className="border border-hairline-strong bg-accent-blue-glow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-link opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-link" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-link">Trạng thái hiện tại</p>
              <p className="text-sm font-bold text-ink">{statusLabel(status)}</p>
            </div>
          </div>
          <div className="text-sm text-ink">
            <p className="font-semibold">{estimateLabel(status)}</p>
            <p className="text-xs text-link">Cập nhật: {formatDateTime(view.latestChangedAt)}</p>
          </div>
        </div>
      </Card>

      {view.source.offer ? (
        (() => {
          const offer = view.source.offer!;
          const deadlinePassed =
            offer.responseDeadline != null && new Date(offer.responseDeadline).getTime() < Date.now();

          if (offer.status === "ACCEPTED") {
            return (
              <Card className="border border-hairline-strong bg-accent-green-glow">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-lg bg-surface-elevated p-2 text-positive">
                    <PartyPopper size={20} />
                  </span>
                  <div>
                    <p className="font-bold text-positive">Bạn đã chấp nhận offer</p>
                    <p className="mt-1 text-sm text-ink">
                      Mức lương {formatAmount(offer.salaryAmount, offer.salaryCurrency)}
                      {offer.startDate ? ` · bắt đầu ${formatDate(offer.startDate)}` : ""}. Bộ phận HR sẽ liên hệ để
                      hoàn tất thủ tục onboarding.
                    </p>
                  </div>
                </div>
              </Card>
            );
          }

          if (offer.status === "DECLINED") {
            return (
              <Card className="border border-hairline-strong bg-accent-red-glow">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-lg bg-surface-elevated p-2 text-negative">
                    <XCircle size={20} />
                  </span>
                  <div>
                    <p className="font-bold text-negative">Bạn đã từ chối offer</p>
                    <p className="mt-1 text-sm text-ink">
                      {offer.declineReason ? `Lý do: ${offer.declineReason}` : "Cảm ơn bạn đã phản hồi."}
                    </p>
                  </div>
                </div>
              </Card>
            );
          }

          return (
            <Card className="border border-hairline-strong bg-accent-green-glow">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-positive">Đề nghị nhận việc</p>
                  <h2 className="mt-1 text-lg font-bold text-ink">
                    {view.source.job?.company?.name ?? "Nhà tuyển dụng"} đã gửi offer cho bạn
                  </h2>
                </div>
                <Badge tone="warning">{offerStatusLabel(offer.status)}</Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-surface-elevated p-3">
                  <p className="text-xs text-body">Mức lương</p>
                  <p className="mt-1 text-sm font-bold text-ink">
                    {formatAmount(offer.salaryAmount, offer.salaryCurrency)}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-elevated p-3">
                  <p className="flex items-center gap-1 text-xs text-body">
                    <CalendarClock size={13} /> Ngày bắt đầu
                  </p>
                  <p className="mt-1 text-sm font-bold text-ink">
                    {offer.startDate ? formatDate(offer.startDate) : "Thỏa thuận"}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-elevated p-3">
                  <p className="flex items-center gap-1 text-xs text-body">
                    <CalendarClock size={13} /> Hạn phản hồi
                  </p>
                  <p className={`mt-1 text-sm font-bold ${deadlinePassed ? "text-negative" : "text-ink"}`}>
                    {offer.responseDeadline ? formatDate(offer.responseDeadline) : "Không giới hạn"}
                  </p>
                </div>
              </div>

              {offer.note ? (
                <div className="mt-3 rounded-xl bg-surface-elevated p-3">
                  <p className="text-xs text-body">Ghi chú từ HR</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{offer.note}</p>
                </div>
              ) : null}

              {offer.offerLetterUrl ? (
                <a
                  href={offer.offerLetterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline"
                >
                  <FileText size={15} /> Xem thư mời nhận việc
                </a>
              ) : null}

              {showDecline ? (
                <div className="mt-4 space-y-3">
                  <FieldLabel label="Lý do từ chối (tùy chọn)">
                    <Textarea
                      value={declineReason}
                      onChange={(event) => setDeclineReason(event.target.value)}
                      placeholder="Chia sẻ lý do giúp nhà tuyển dụng cải thiện..."
                      maxLength={1000}
                    />
                  </FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      isLoading={offerActionLoading === "decline"}
                      onClick={() => void respondOffer("decline")}
                    >
                      Xác nhận từ chối
                    </Button>
                    <Button variant="ghost" onClick={() => setShowDecline(false)}>
                      Quay lại
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    leftIcon={<CheckCircle2 size={16} />}
                    isLoading={offerActionLoading === "accept"}
                    onClick={() => void respondOffer("accept")}
                  >
                    Chấp nhận offer
                  </Button>
                  <Button variant="secondary" leftIcon={<XCircle size={16} />} onClick={() => setShowDecline(true)}>
                    Từ chối
                  </Button>
                </div>
              )}
            </Card>
          );
        })()
      ) : null}

      <Card>
        <h2 className="text-lg font-bold text-ink">Tiến trình tuyển dụng</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          {pipelineSteps.map((step, index) => {
            const state = timelineState(index, view.currentStage);
            return (
              <div key={step.key} className="relative">
                {index < pipelineSteps.length - 1 ? (
                  <div className="absolute left-[52%] top-3 hidden h-0.5 w-[96%] -translate-y-1/2 bg-ink/10 sm:block" />
                ) : null}
                <div className="relative rounded-xl bg-canvas-soft p-3">
                  <div className={`h-3 w-3 rounded-full border-2 ${timelineDotClass(state)}`} />
                  <p className={`mt-2 text-sm font-semibold ${stepTextClass(state)}`}>{step.label}</p>
                  <p className="mt-1 text-xs text-body">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold text-ink">Thông tin ứng tuyển</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-ink/5 pb-2">
              <dt className="text-body">Candidate</dt>
              <dd className="font-semibold text-ink">{view.source.candidate?.profile?.fullName ?? fallbackApplication.candidate.profile.fullName}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-ink/5 pb-2">
              <dt className="text-body">Trạng thái</dt>
              <dd><StatusBadge status={status} /></dd>
            </div>
            <div className="flex items-center justify-between border-b border-ink/5 pb-2">
              <dt className="text-body">Địa điểm</dt>
              <dd className="font-semibold text-ink flex items-center gap-1"><MapPin size={14} /> {view.source.job?.location ?? fallbackApplication.job.location}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-ink/5 pb-2">
              <dt className="text-body">AI Score</dt>
              <dd className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${gradeClass(view.grade)}`}>Grade {view.grade}</span>
                <span className={view.grade.startsWith("C") ? "rounded-full bg-accent-yellow-glow px-3 py-1 text-xs font-bold text-warning" : "rounded-full bg-surface-elevated px-3 py-1 text-xs font-bold text-ink"}>
                  {formatScore(view.score)}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-ink/5 pb-2">
              <dt className="text-body">Job type</dt>
              <dd className="font-semibold text-ink">{view.source.job?.jobType ?? fallbackApplication.job.jobType}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-body">Salary</dt>
              <dd className="font-semibold text-ink">{formatSalary(view.source.job?.minSalary, view.source.job?.maxSalary, view.source.job?.salaryCurrency ?? "VND")}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-ink">Thư giới thiệu</h2>
          <div className="mt-4 rounded-xl border border-ink/10 bg-canvas-soft p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-body">
              {view.source.coverLetter ?? fallbackApplication.coverLetter}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <h2 className="text-lg font-bold text-ink">Lịch sử trạng thái</h2>
          <ol className="relative mt-6 pl-6 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-ink/10 space-y-6">
            {pipelineSteps.map((step, idx) => {
              const state = timelineState(idx, view.currentStage);
              const stepHistory = (view.source.statusHistory ?? []).find((item) => {
                if (step.key === "RESULT") {
                  return ["INTERVIEW", "OFFER", "HIRED", "REJECTED"].includes(item.toStatus);
                }
                return item.toStatus === step.key;
              });
              const timestamp =
                step.key === "APPLIED"
                  ? view.source.appliedAt
                  : stepHistory?.changedAt;
              const note =
                stepHistory?.note ??
                step.description;

              return (
                <motion.li 
                  key={step.key} 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  className="relative"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 + 0.2, type: "spring", stiffness: 300 }}
                    className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 shadow-[0_0_0_2px_var(--bg-canvas)] flex items-center justify-center ${timelineDotClass(state)}`}
                  >
                    {state === "active" && <span className="absolute h-full w-full animate-ping rounded-full bg-link opacity-50" />}
                  </motion.div>
                  <div className={`rounded-xl border ${state === "active" ? "border-link/30 bg-link/5" : "border-ink/10 bg-canvas-soft"} p-4 shadow-sm transition-colors`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${stepTextClass(state)}`}>{step.label}</p>
                      <p className="text-xs font-medium text-body bg-surface-elevated px-2 py-1 rounded-full">{timestamp ? formatDateTime(timestamp) : "Chưa có cập nhật"}</p>
                    </div>
                    <p className="mt-2 text-sm text-body">{note}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-ink">AI Score preview</h2>
          <div className="mt-4 rounded-xl border border-ink/10 bg-canvas-soft p-4">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <svg className="h-20 w-20 -rotate-90">
                  <circle cx="40" cy="40" r="30" strokeWidth="8" className="stroke-ink/10 fill-none" />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    strokeWidth="8"
                    className="stroke-blue-500 fill-none"
                    strokeDasharray={188.5}
                    strokeDashoffset={188.5 - (188.5 * scorePct) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-ink">
                  {formatScore(view.score)}
                </span>
              </div>
              <div>
                <p className={`inline-flex rounded-pill px-3 py-1 text-xs font-bold ${gradeClass(view.grade)}`}>Grade {view.grade}</p>
                <p className="mt-1 text-xs text-body">Tổng quan mức độ phù hợp hiện tại</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { label: "Skills", value: Number(view.source.aiResult?.skillScore ?? fallbackApplication.aiResult.skillScore) },
                { label: "Experience", value: Number(view.source.aiResult?.experienceScore ?? fallbackApplication.aiResult.experienceScore) },
                { label: "Education", value: Number(view.source.aiResult?.educationScore ?? fallbackApplication.aiResult.educationScore) },
                { label: "Others", value: Number(view.source.aiResult?.otherScore ?? fallbackApplication.aiResult.otherScore) }
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-body">{item.label}</span>
                    <span className="font-semibold text-ink">{item.value.toFixed(1)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-elevated">
                    <div className="h-2 rounded-full bg-link" style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <Link href={`/ai-score/${view.source.id}`} className="mt-4 inline-flex">
              <Button fullWidth>View detail</Button>
            </Link>
          </div>
        </Card>
      </div>

      <Card className="border border-hairline-strong bg-accent-yellow-glow">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg bg-surface-elevated p-2 text-warning">
            <Lightbulb size={18} />
          </span>
          <div>
            <p className="font-semibold text-warning">Trong khi chờ kết quả...</p>
            <p className="mt-1 text-sm text-ink">
              Hãy cập nhật profile và bổ sung thêm dự án gần đây để tăng độ tin cậy hồ sơ cho các vòng đánh giá tiếp theo.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

