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

function AnimatedScore({ value }: { value: number }) {
  const prefersReducedMotion = useReducedMotion();
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => current.toFixed(1));

  useEffect(() => {
    if (prefersReducedMotion) {
      spring.set(value);
    } else {
      spring.set(value);
    }
  }, [value, spring, prefersReducedMotion]);

  return <motion.span>{prefersReducedMotion ? value.toFixed(1) : display}</motion.span>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <ErrorBlock message="Chưa có kết quả AI screening. Hệ thống đang tự kiểm tra lại trong vài giây." />
        {canRescreen ? (
          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-body">
              Nếu kết quả chưa xuất hiện, recruiter có thể chạy lại AI screening ngay.
            </p>
            <Button
              className="px-4 py-2 text-sm"
              disabled={actionLoading}
              onClick={() => void requestRescreen()}
            >
              {actionLoading ? "Đang chạy..." : "Chạy lại AI screening"}
            </Button>
          </Card>
        ) : null}
        {actionMessage ? <p className="text-sm text-body">{actionMessage}</p> : null}
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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Chi tiết AI Score"
          description={`${application.job?.title} · ${application.job?.company?.name}`}
          actions={
            <div className="flex items-center gap-3">
              {application.cvFile ? (
                <a href={application.cvFile.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="px-3 py-1 text-sm font-medium">
                    <span className="mr-1.5">📄</span> Xem CV
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
          <Card className="flex h-full flex-col justify-center text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-mute">Tổng quan độ phù hợp</p>
            <div className="my-6">
              <p className="font-display text-7xl font-black tracking-tight text-ink sm:text-display-xl">
                <AnimatedScore value={overall} />
              </p>
              <Badge tone={overall >= 75 ? "positive" : overall >= 50 ? "warning" : "negative"} className="mt-4 px-3 py-1 text-sm font-bold uppercase tracking-widest">
                Grade {ai.grade ?? "—"}
              </Badge>
            </div>
            {ai.explanation && (
              <div className="mt-4 rounded-xl bg-canvas-soft p-4">
                <p className="text-left text-sm text-body leading-relaxed">{ai.explanation}</p>
              </div>
            )}
            {ai.processingTimeMs && (
              <p className="mt-4 text-xs font-medium text-mute/60">Xử lý tự động trong {ai.processingTimeMs}ms</p>
            )}
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="h-full">
          <Card className="flex h-full flex-col space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Chi tiết đánh giá</h2>
              <Badge variant="outline" className="text-xs">Weights</Badge>
            </div>
            <div className="space-y-6">
              <div className="group relative">
                <ScoreBar label="Kỹ năng chuyên môn (40%)" value={parseFloat(String(ai.skillScore ?? 0))} />
              </div>
              <div className="group relative">
                <ScoreBar label="Kinh nghiệm làm việc (30%)" value={parseFloat(String(ai.experienceScore ?? 0))} />
              </div>
              <div className="group relative">
                <ScoreBar label="Nền tảng học vấn (20%)" value={parseFloat(String(ai.educationScore ?? 0))} />
              </div>
              <div className="group relative">
                <ScoreBar label="Tiêu chí khác (10%)" value={parseFloat(String(ai.otherScore ?? 0))} />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants} className="h-full">
          <Card className="flex h-full flex-col">
            <div className="mb-6 flex items-center justify-between border-b border-ink/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight text-ink">Phân tích Kỹ năng</h2>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-pale text-primary">💡</span>
            </div>
            
            <div className="flex-1 space-y-8">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-positive">
                  <span className="h-2 w-2 rounded-full bg-positive"></span>
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
                        <Badge tone="positive" className="px-3 py-1.5 shadow-sm">
                          {skill}
                        </Badge>
                      </motion.div>
                    ))
                  ) : (
                    <span className="text-sm italic text-mute">Chưa xác định được kỹ năng phù hợp</span>
                  )}
                </motion.div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-negative">
                  <span className="h-2 w-2 rounded-full bg-negative"></span>
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
                        <Badge tone="negative" className="px-3 py-1.5 shadow-sm opacity-90">
                          {skill}
                        </Badge>
                      </motion.div>
                    ))
                  ) : (
                    <div className="rounded-lg bg-positive-bg/30 px-4 py-2 text-sm font-medium text-positive">
                      ✨ Không có khoảng trống kỹ năng đáng kể so với JD
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
              <h2 className="text-xl font-bold tracking-tight">Nhận xét chi tiết</h2>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas-soft text-ink">📋</span>
            </div>

            <div className="flex-1 space-y-6">
              <div className="rounded-xl border border-positive/20 bg-positive-bg/10 p-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-positive">
                  <span>🚀</span> Điểm mạnh
                </p>
                <ul className="space-y-2.5">
                  {(ai.strengths ?? []).map((s, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-3 text-sm font-medium text-body"
                    >
                      <span className="mt-0.5 text-positive">✓</span>
                      <span className="leading-relaxed">{s}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {(ai.concerns ?? []).length > 0 ? (
                <div className="rounded-xl border border-warning/20 bg-warning/5 p-5">
                  <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-warning-deep">
                    <span>⚠️</span> Lưu ý cần xem xét
                  </p>
                  <ul className="space-y-2.5">
                    {ai.concerns!.map((c, i) => (
                      <motion.li 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex items-start gap-3 text-sm font-medium text-body"
                      >
                        <span className="mt-0.5 text-warning-deep">•</span>
                        <span className="leading-relaxed">{c}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="mt-8 space-y-5 border-t border-ink/5 pt-6">
              <label className="flex items-start gap-3 rounded-xl bg-canvas-soft p-4 transition-colors hover:bg-canvas-soft/80 cursor-pointer">
                <div className="flex h-5 items-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-ink/20 text-primary transition focus:ring-primary focus:ring-offset-2"
                    checked={reviewed} 
                    onChange={(e) => setReviewed(e.target.checked)} 
                  />
                </div>
                <span className="text-sm font-medium text-body leading-tight">
                  Tôi đã xem xét kết quả AI. Kết quả này chỉ mang tính tham khảo và hỗ trợ, không thay thế quyết định tuyển dụng cuối cùng.
                </span>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                {canManage ? (
                  <Button
                    disabled={!reviewed || actionLoading}
                    className="flex-1 py-2.5 shadow-sm transition-all"
                    onClick={() => void moveToInterview()}
                  >
                    {actionLoading ? "Đang xử lý..." : "Chuyển sang Phỏng vấn"}
                  </Button>
                ) : null}
                <Link href={`/applications/${application.id}`} className="flex-1">
                  <Button variant="secondary" className="w-full py-2.5">
                    Quay lại đơn ứng tuyển
                  </Button>
                </Link>
              </div>
              {actionMessage ? (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-center text-sm font-medium text-body">
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
