"use client";

import Link from "next/link";
import { Application } from "../lib/types";
import { formatDate } from "../lib/format";
import {
  applicationHasAiScore,
  getCandidateApplicationDisplay
} from "../lib/application-status";
import { ApplicationAiScorePanel } from "./application-ai-score";
import { apiFetch } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Sparkles, ChevronRight, FileText, PartyPopper, RotateCcw, XCircle } from "lucide-react";
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
  const [reapplying, setReapplying] = useState(false);
  const isWithdrawn = application.status === "WITHDRAWN";
  const display = getCandidateApplicationDisplay(application);
  const score = applicationHasAiScore(application)
    ? Number(application.aiResult!.overallScore)
    : undefined;

  const canWithdraw = !["HIRED", "REJECTED", "WITHDRAWN"].includes(application.status);

  const withdraw = async () => {
    if (!token || withdrawing) return;
    if (!window.confirm("Bạn chắc chắn muốn rút đơn ứng tuyển này?")) return;
    setWithdrawing(true);
    const res = await apiFetch<Application>(`/applications/${application.id}`, {
      method: "DELETE",
      token
    });
    setWithdrawing(false);
    if (res.ok) {
      toast.success("Đã rút đơn ứng tuyển");
      onWithdrawn?.();
    } else {
      toast.error(res.error ?? "Không rút được đơn");
    }
  };

  const reapply = async () => {
    if (!token || reapplying) return;
    setReapplying(true);
    const res = await apiFetch<Application>(`/applications/${application.id}/reapply`, {
      method: "POST",
      token
    });
    setReapplying(false);
    if (res.ok) {
      toast.success("Đã gửi lại đơn ứng tuyển");
      onWithdrawn?.();
    } else {
      toast.error(res.error ?? "Không ứng tuyển lại được");
    }
  };

  return (
    <Card
      hover={!isWithdrawn}
      variant="content"
      className={`group relative overflow-hidden ${isWithdrawn ? "opacity-90" : ""}`}
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={display.variant}>{display.label}</Badge>
          {isWithdrawn ? (
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              leftIcon={<RotateCcw size={14} />}
              isLoading={reapplying}
              onClick={reapply}
            >
              Ứng tuyển lại
            </Button>
          ) : null}
        </div>
      </div>

      {application.offer?.status === "PENDING" && !isWithdrawn ? (
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

      {isWithdrawn ? (
        <p className="mt-4 text-sm text-mute">
          Đơn đã được rút. Bạn có thể ứng tuyển lại bất cứ lúc nào bằng nút bên cạnh.
        </p>
      ) : (
        <div className={`mt-5 grid gap-3 ${display.isAiLoading ? "sm:grid-cols-1" : "sm:grid-cols-3"}`}>
          <ApplicationAiScorePanel
            loading={display.isAiLoading}
            score={score}
            grade={application.aiResult?.grade}
          />
          {!display.isAiLoading ? (
            <div className="rounded-xl bg-canvas px-4 py-3 sm:col-span-1">
              <p className="mb-1 text-caption font-semibold uppercase tracking-wider text-mute">Vị trí</p>
              <p className="mt-1 line-clamp-1 text-body-sm font-bold text-ink">
                {application.job?.location ?? "Remote"}
              </p>
            </div>
          ) : null}
        </div>
      )}

      <AnimatePresence>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 20 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2 border-t border-ink/5 pt-4 sm:flex-row sm:flex-wrap"
          >
            {!isWithdrawn ? (
              <Link href={`/applications/${application.id}`} className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto" leftIcon={<FileText size={16} />}>
                  Chi tiết
                </Button>
              </Link>
            ) : null}
            {display.hasScore ? (
              <Link href={`/ai-score/${application.id}`} className="w-full sm:w-auto">
                <Button variant="primary" className="w-full sm:w-auto" leftIcon={<Sparkles size={16} />}>
                  Xem AI Score
                </Button>
              </Link>
            ) : null}
            {isWithdrawn ? (
              <Button
                variant="primary"
                className="w-full sm:w-auto"
                leftIcon={<RotateCcw size={16} />}
                isLoading={reapplying}
                onClick={reapply}
              >
                Ứng tuyển lại
              </Button>
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
        <div className="mt-5 flex items-center justify-between gap-3 text-body-sm font-semibold text-ink-deep">
          {isWithdrawn ? (
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              leftIcon={<RotateCcw size={14} />}
              isLoading={reapplying}
              onClick={reapply}
            >
              Ứng tuyển lại
            </Button>
          ) : (
            <span className="flex items-center gap-1">
              Xem chi tiết <ChevronRight size={16} />
            </span>
          )}
        </div>
      ) : null}
    </Card>
  );
}
