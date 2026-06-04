"use client";

import Link from "next/link";
import { Application } from "../lib/types";
import { formatDate, formatScore } from "../lib/format";
import { apiFetch } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { Card } from "./ui/card";
import { Badge, BadgeVariant } from "./ui/badge";
import { Button } from "./ui/button";
import { Sparkles, ChevronRight, FileText, PartyPopper, XCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function ApplicationCard({
  application,
  onWithdrawn
}: {
  application: Application;
  onWithdrawn?: () => void;
}) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const score = application.aiResult?.overallScore ? Number(application.aiResult.overallScore) : undefined;

  const canWithdraw = !["HIRED", "REJECTED"].includes(application.status);

  const withdraw = async () => {
    if (!token || withdrawing) return;
    if (!window.confirm("Bạn chắc chắn muốn rút đơn ứng tuyển này?")) return;
    setWithdrawing(true);
    const res = await apiFetch(`/applications/${application.id}`, { method: "DELETE", token });
    setWithdrawing(false);
    if (res.ok) {
      toast.success("Đã rút đơn ứng tuyển");
      onWithdrawn?.();
    } else {
      toast.error(res.error ?? "Không rút được đơn");
    }
  };

  const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
    APPLIED: { label: "Đã nộp", variant: "pending" },
    AI_SCREENING: { label: "AI Đang chấm", variant: "screening" },
    HR_REVIEW: { label: "HR Đang xem", variant: "review" },
    INTERVIEW: { label: "Phỏng vấn", variant: "interview" },
    OFFER: { label: "Đề nghị", variant: "accepted" },
    REJECTED: { label: "Từ chối", variant: "rejected" }
  };

  const statusInfo = statusMap[application.status] || { label: application.status, variant: "pending" as BadgeVariant };

  const getScoreColor = (s?: number) => {
    if (!s) return "text-mute";
    if (s >= 80) return "text-positive-deep";
    if (s >= 60) return "text-warning-deep";
    return "text-negative-deep";
  };

  const getScoreBg = (s?: number) => {
    if (!s) return "bg-canvas";
    if (s >= 80) return "bg-primary-pale";
    if (s >= 60) return "bg-warning/30";
    return "bg-negative-bg/10";
  };

  return (
    <Card
      hover
      variant="content"
      className="group relative overflow-hidden"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink transition group-hover:text-ink-deep">
            {application.job?.title ?? "Ứng tuyển"}
          </h2>
          <p className="mt-1 text-body-sm font-medium text-body">
            {application.job?.company?.name} · Nộp {formatDate(application.appliedAt)}
          </p>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      {application.offer?.status === "PENDING" ? (
        <Link
          href={`/applications/${application.id}`}
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-hairline-strong bg-accent-green-glow px-4 py-3 transition-colors hover:bg-surface-elevated"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-positive">
            <PartyPopper size={16} /> Bạn nhận được offer — phản hồi ngay
          </span>
          <ChevronRight size={16} className="text-positive" />
        </Link>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className={`rounded-xl px-4 py-3 ${getScoreBg(score)} transition-colors`}>
          <p className="mb-1 text-caption font-semibold uppercase tracking-wider text-mute">AI Score</p>
          <div className="flex items-end gap-1">
            <p className={`text-2xl font-black tabular-nums leading-none ${getScoreColor(score)}`}>
              {score ? formatScore(score) : "—"}
            </p>
            {score ? <span className="mb-0.5 text-caption font-bold text-mute">/100</span> : null}
          </div>
        </div>
        <div className="rounded-xl bg-canvas px-4 py-3">
          <p className="mb-1 text-caption font-semibold uppercase tracking-wider text-mute">Grade</p>
          <p className={`text-2xl font-black leading-none ${getScoreColor(score)}`}>
            {application.aiResult?.grade ?? "—"}
          </p>
        </div>
        <div className="rounded-xl bg-canvas px-4 py-3">
          <p className="mb-1 text-caption font-semibold uppercase tracking-wider text-mute">Vị trí</p>
          <p className="mt-1 line-clamp-1 text-body-sm font-bold text-ink">
            {application.job?.location ?? "Remote"}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 20 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2 border-t border-ink/5 pt-4 sm:flex-row sm:flex-wrap"
          >
            <Link href={`/applications/${application.id}`} className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto" leftIcon={<FileText size={16} />}>
                Chi tiết
              </Button>
            </Link>
            {application.aiResult ? (
              <Link href={`/ai-score/${application.id}`} className="w-full sm:w-auto">
                <Button variant="primary" className="w-full sm:w-auto" leftIcon={<Sparkles size={16} />}>
                  Xem AI Score
                </Button>
              </Link>
            ) : null}
            <div className="flex-1" />
            {canWithdraw ? (
              <Button
                variant="ghost"
                className="w-full text-negative-deep hover:bg-negative-bg/10 sm:w-auto"
                leftIcon={<XCircle size={16} />}
                isLoading={withdrawing}
                onClick={withdraw}
              >
                Rút đơn
              </Button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!expanded ? (
        <div className="mt-5 flex items-center text-body-sm font-semibold text-ink-deep">
          <span className="flex items-center gap-1">
            Xem chi tiết <ChevronRight size={16} />
          </span>
        </div>
      ) : null}
    </Card>
  );
}
