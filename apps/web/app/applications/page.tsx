"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { Application } from "../../lib/types";
import { AuthGate } from "../../components/auth-gate";
import { ApplicationCard } from "../../components/application-card";
import { PageHeader } from "../../components/ui/card";
import { EmptyState, ErrorBlock, SkeletonList } from "../../components/ui/states";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, Users, Briefcase, Sparkles } from "lucide-react";
import {
  applicationHasAiScore,
  isAiScreeningInProgress
} from "../../lib/application-status";

function ApplicationsContent() {
  const { token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback((options?: { silent?: boolean }) => {
    if (!token) return;
    if (!options?.silent) setLoading(true);
    void apiFetch<Application[]>("/applications/me", { token }).then((res) => {
      if (res.ok && res.data) setApplications(res.data);
      else if (!options?.silent) setError(res.error ?? "Không tải được danh sách");
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const hasScreeningPending = useMemo(
    () => applications.some(isAiScreeningInProgress),
    [applications]
  );

  useEffect(() => {
    if (!token || !hasScreeningPending) return;
    const timer = window.setInterval(() => loadApplications({ silent: true }), 5000);
    return () => window.clearInterval(timer);
  }, [token, hasScreeningPending, loadApplications]);

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Đơn ứng tuyển của tôi"
          description="Theo dõi trạng thái pipeline và xem chi tiết AI score cho từng vị trí."
        />
        <SkeletonList count={3} />
      </div>
    );
  }
  if (error) return <ErrorBlock message={error} onRetry={() => { setLoading(true); setError(null); loadApplications(); }} />;

  const activeApplications = applications.filter((a) => a.status !== "WITHDRAWN");
  const stats = {
    screening: activeApplications.filter(isAiScreeningInProgress).length,
    success: activeApplications.filter((a) => a.status === "APPLIED" && applicationHasAiScore(a)).length,
    review: activeApplications.filter((a) => a.status === "HR_REVIEW").length,
    interview: activeApplications.filter((a) => a.status === "INTERVIEW").length,
    offer: activeApplications.filter((a) => a.status === "OFFER").length,
    withdrawn: applications.filter((a) => a.status === "WITHDRAWN").length
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Đơn ứng tuyển của tôi"
        description="Theo dõi trạng thái pipeline và xem chi tiết AI score cho từng vị trí."
      />
      
      {applications.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "AI đang chấm", count: stats.screening, icon: <Sparkles size={20} />, color: "text-warning", bg: "bg-canvas-soft" },
            { label: "Ứng tuyển thành công", count: stats.success, icon: <CheckCircle2 size={20} />, color: "text-positive-deep", bg: "bg-primary-pale" },
            { label: "HR Đang xem", count: stats.review, icon: <Users size={20} />, color: "text-link", bg: "bg-canvas" },
            { label: "Phỏng vấn", count: stats.interview, icon: <Briefcase size={20} />, color: "text-ink-deep", bg: "bg-primary-neutral" },
            { label: "Đề nghị", count: stats.offer, icon: <FileText size={20} />, color: "text-body", bg: "bg-canvas" }
          ].map((stage, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex flex-col items-center justify-center rounded-xl border border-ink/5 bg-canvas p-4 text-center shadow-sm"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${stage.bg} ${stage.color}`}>
                {stage.icon}
              </div>
              <p className="mb-1 text-2xl font-black tabular-nums leading-none text-ink">{stage.count}</p>
              <p className="text-caption font-semibold uppercase tracking-wider text-body">{stage.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {applications.length === 0 ? (
        <EmptyState
          title="Chưa có đơn ứng tuyển"
          description="Khám phá việc làm và nộp hồ sơ để nhận điểm AI."
          actionLabel="Xem việc làm"
          actionHref="/jobs"
        />
      ) : (
        <div className="space-y-4 stagger-children">
          {applications.map((app, i) => (
            <motion.div 
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <ApplicationCard application={app} onWithdrawn={loadApplications} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <AuthGate roles={["CANDIDATE"]}>
      <ApplicationsContent />
    </AuthGate>
  );
}
