"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { apiFetch } from "../../../lib/api-client";
import { Application } from "../../../lib/types";
import { formatScore } from "../../../lib/format";
import { AuthGate } from "../../../components/auth-gate";
import { PageHeader, Card } from "../../../components/ui/card";
import { Badge, StatusBadge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { ErrorBlock, LoadingBlock, ScoreBar } from "../../../components/ui/states";
import { motion, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { FileText, Sparkles, CheckCircle2, AlertTriangle, ChevronLeft, ArrowRight } from "lucide-react";

function CircularProgress({ value, grade }: { value: number, grade: string }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const prefersReducedMotion = useReducedMotion();
  
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const strokeDashoffset = useTransform(spring, (current) => circumference - (current / 100) * circumference);
  const displayValue = useTransform(spring, (current) => current.toFixed(1));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  let colorClass = "text-positive-deep";
  let bgClass = "text-primary-pale";
  if (value < 50) {
    colorClass = "text-negative-deep";
    bgClass = "text-negative-bg/20";
  } else if (value < 75) {
    colorClass = "text-warning-deep";
    bgClass = "text-warning/40";
  }

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          className={bgClass}
          strokeWidth="12"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="96"
          cy="96"
        />
        <motion.circle
          className={colorClass}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={prefersReducedMotion ? circumference - (value / 100) * circumference : strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="96"
          cy="96"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <motion.span className={`text-4xl font-black tabular-nums tracking-tight ${colorClass}`}>
          {prefersReducedMotion ? value.toFixed(1) : displayValue}
        </motion.span>
        <span className="text-sm font-bold text-mute">/ 100</span>
      </div>
    </div>
  );
}

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function AiScoreContent() {
  const params = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadApplication = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch<Application>(`/applications/${params.id}`, { token });
    if (res.ok && res.data) setApplication(res.data);
    setLoading(false);
    setAttempts((value) => value + 1);
  }, [params.id, token]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  useEffect(() => {
    if (loading || application?.aiResult || attempts >= 8) return;
    const timer = window.setTimeout(() => {
      void loadApplication();
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [application?.aiResult, attempts, loadApplication, loading]);

  if (loading) return <LoadingBlock />;
  if (!application?.aiResult) {
    const canRescreen = user?.role === "RECRUITER" || user?.role === "ADMIN";

    async function requestRescreen() {
      if (!token || !application) return;
      setActionLoading(true);
      setActionMessage(null);
      const res = await apiFetch(`/applications/${application.id}/rescreen`, {
        method: "POST",
        token
      });
      setActionLoading(false);
      setActionMessage(res.ok ? "Đã gửi yêu cầu chạy lại AI screening." : res.error ?? "Không thể chạy lại AI screening.");
      setAttempts(0);
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-3xl mx-auto mt-8">
        <ErrorBlock message="Chưa có kết quả AI screening. Hệ thống đang tự kiểm tra lại trong vài giây." />
        {canRescreen ? (
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-body">
              Nếu kết quả chưa xuất hiện, recruiter có thể chạy lại AI screening ngay.
            </p>
            <Button
              className="px-6"
              isLoading={actionLoading}
              onClick={() => void requestRescreen()}
            >
              Chạy lại AI screening
            </Button>
          </Card>
        ) : null}
        {actionMessage ? <p className="text-sm font-medium text-body text-center">{actionMessage}</p> : null}
      </motion.div>
    );
  }

  const ai = application.aiResult;
  const overall = parseFloat(String(ai.overallScore));
  const canManage = user?.role === "RECRUITER" || user?.role === "ADMIN";

  async function moveToInterview() {
    if (!token || !application) return;
    setActionLoading(true);
    setActionMessage(null);
    const res = await apiFetch(`/applications/${application.id}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({
        status: "INTERVIEW",
        note: "AI score reviewed from AI Score page"
      })
    });
    setActionLoading(false);
    if (res.ok) {
      setApplication((prev) => (prev ? { ...prev, status: "INTERVIEW" } : prev));
      setActionMessage("Đã chuyển ứng viên sang phỏng vấn.");
      return;
    }
    setActionMessage(res.error ?? "Không thể chuyển trạng thái ứng viên.");
  }

  let gradeVariant: any = "active";
  if (ai.grade?.startsWith('A')) gradeVariant = "active";
  else if (ai.grade?.startsWith('B')) gradeVariant = "screening";
  else if (ai.grade?.startsWith('C')) gradeVariant = "pending";
  else gradeVariant = "rejected";

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={itemVariants}>
        <Link href="/applications" className="inline-flex items-center text-sm font-semibold text-body hover:text-ink-deep transition-colors mb-6">
          <ChevronLeft size={16} className="mr-1" /> Quay lại danh sách
        </Link>
        <PageHeader
          title="Chi tiết AI Score"
          description={`${application.job?.title} · ${application.job?.company?.name}`}
          actions={
            <div className="flex items-center gap-3">
              {application.cvFile ? (
                <a href={application.cvFile.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" leftIcon={<FileText size={16} />}>
                    Xem CV
                  </Button>
                </a>
              ) : null}
              <StatusBadge status={application.status} />
            </div>
          }
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <motion.div variants={itemVariants} className="h-full">
          <Card className="flex h-full flex-col justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={120} />
            </div>
            
            <p className="text-sm font-bold uppercase tracking-wider text-mute mb-6">Tổng quan độ phù hợp</p>
            
            <CircularProgress value={overall} grade={ai.grade ?? "—"} />
            
            <div className="mt-6 flex justify-center">
              <Badge variant={gradeVariant} className="px-4 py-1.5 text-sm font-bold uppercase tracking-widest shadow-sm">
                Grade {ai.grade ?? "—"}
              </Badge>
            </div>
            
            {ai.explanation && (
              <div className="mt-8 rounded-xl bg-canvas p-5 border border-ink/5">
                <p className="text-left text-sm text-body leading-relaxed italic">"{ai.explanation}"</p>
              </div>
            )}
            
            {ai.processingTimeMs && (
              <p className="mt-6 text-xs font-medium text-mute flex items-center justify-center gap-1.5">
                <Sparkles size={12} /> Xử lý tự động trong {ai.processingTimeMs}ms
              </p>
            )}
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="h-full">
          <Card className="flex h-full flex-col space-y-8">
            <div className="flex items-center justify-between border-b border-ink/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight text-ink">Chi tiết đánh giá</h2>
              <span className="text-xs font-bold text-mute uppercase tracking-wider bg-canvas-soft px-2 py-1 rounded-md">Trọng số</span>
            </div>
            <div className="space-y-6">
              <ScoreBar label="Kỹ năng chuyên môn (40%)" value={parseFloat(String(ai.skillScore ?? 0))} />
              <ScoreBar label="Kinh nghiệm làm việc (30%)" value={parseFloat(String(ai.experienceScore ?? 0))} />
              <ScoreBar label="Nền tảng học vấn (20%)" value={parseFloat(String(ai.educationScore ?? 0))} />
              <ScoreBar label="Tiêu chí khác (10%)" value={parseFloat(String(ai.otherScore ?? 0))} />
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants} className="h-full">
          <Card className="flex h-full flex-col">
            <div className="mb-6 flex items-center justify-between border-b border-ink/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight text-ink">Phân tích Kỹ năng</h2>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-pale text-ink-deep">
                <Sparkles size={20} />
              </div>
            </div>
            
            <div className="flex-1 space-y-8">
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-deep">
                  <CheckCircle2 size={16} />
                  Kỹ năng phù hợp ({(ai.matchedSkills ?? []).length})
                </h3>
                <motion.div 
                  variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                  initial="hidden" animate="show"
                  className="flex flex-wrap gap-2"
                >
                  {(ai.matchedSkills ?? []).length > 0 ? (
                    (ai.matchedSkills ?? []).map((skill) => (
                      <motion.div key={skill} variants={itemVariants}>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-pale text-positive-deep text-sm font-semibold border border-primary/20">
                          {skill}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <span className="text-sm italic text-mute">Chưa xác định được kỹ năng phù hợp</span>
                  )}
                </motion.div>
              </div>

              <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-500">
                  <AlertTriangle size={16} />
                  Kỹ năng còn thiếu ({(ai.missingSkills ?? []).length})
                </h3>
                <motion.div 
                  variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                  initial="hidden" animate="show"
                  className="flex flex-wrap gap-2"
                >
                  {(ai.missingSkills ?? []).length > 0 ? (
                    ai.missingSkills!.map((skill) => (
                      <motion.div key={skill} variants={itemVariants}>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-sm font-semibold border border-red-200">
                          {skill}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-primary-pale/50 border border-primary/20 px-4 py-3 text-sm font-medium text-positive-deep flex items-center gap-2">
                      <Sparkles size={16} /> Không có khoảng trống kỹ năng đáng kể so với JD
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="h-full">
          <Card className="flex h-full flex-col">
            <div className="mb-6 flex items-center justify-between border-b border-ink/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight text-ink">Nhận xét chi tiết</h2>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas-soft text-body">
                <FileText size={20} />
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="rounded-xl border border-primary/20 bg-primary-pale/30 p-6">
                <p className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-deep">
                  <CheckCircle2 size={16} /> Điểm mạnh
                </p>
                <ul className="space-y-3">
                  {(ai.strengths ?? []).map((s, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-3 text-[15px] font-medium text-ink"
                    >
                      <span className="mt-0.5 text-ink-deep"><CheckCircle2 size={16} /></span>
                      <span className="leading-relaxed">{s}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {(ai.concerns ?? []).length > 0 ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
                  <p className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-600">
                    <AlertTriangle size={16} /> Lưu ý cần xem xét
                  </p>
                  <ul className="space-y-3">
                    {ai.concerns!.map((c, i) => (
                      <motion.li 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex items-start gap-3 text-[15px] font-medium text-ink"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                        <span className="leading-relaxed">{c}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="mt-8 space-y-5 border-t border-ink/5 pt-6">
              <label className="flex items-start gap-3 rounded-xl bg-canvas p-4 transition-colors hover:bg-canvas-soft cursor-pointer border border-transparent hover:border-ink/5">
                <div className="flex h-5 items-center mt-0.5">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-ink/10 text-ink-deep transition focus:ring-primary focus:ring-offset-2"
                    checked={reviewed} 
                    onChange={(e) => setReviewed(e.target.checked)} 
                  />
                </div>
                <span className="text-sm font-medium text-body leading-relaxed">
                  Tôi đã xem xét kết quả AI. Kết quả này chỉ mang tính tham khảo và hỗ trợ, không thay thế quyết định tuyển dụng cuối cùng.
                </span>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                {canManage ? (
                  <Button
                    disabled={!reviewed || actionLoading}
                    isLoading={actionLoading}
                    className="flex-1 py-3"
                    onClick={() => void moveToInterview()}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Chuyển sang Phỏng vấn
                  </Button>
                ) : null}
                <Link href={`/applications/${application.id}`} className={canManage ? "flex-1" : "w-full"}>
                  <Button variant="secondary" className="w-full py-3">
                    Quay lại đơn ứng tuyển
                  </Button>
                </Link>
              </div>
              {actionMessage ? (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-center text-sm font-bold text-ink-deep">
                  {actionMessage}
                </motion.p>
              ) : null}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function AiScorePage() {
  return (
    <AuthGate roles={["CANDIDATE", "RECRUITER", "ADMIN"]}>
      <AiScoreContent />
    </AuthGate>
  );
}
