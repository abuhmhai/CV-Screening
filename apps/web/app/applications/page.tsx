"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { Application } from "../../lib/types";
import { AuthGate } from "../../components/auth-gate";
import { ApplicationCard } from "../../components/application-card";
import { PageHeader } from "../../components/ui/card";
import { EmptyState, ErrorBlock, LoadingBlock } from "../../components/ui/states";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, Users, Briefcase } from "lucide-react";

function ApplicationsContent() {
  const { token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void apiFetch<Application[]>("/applications/me", { token }).then((res) => {
      if (res.ok && res.data) setApplications(res.data);
      else setError(res.error ?? "Không tải được danh sách");
      setLoading(false);
    });
  }, [token]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;

  // Tính toán số lượng theo từng stage
  const stats = {
    applied: applications.filter(a => a.status === "APPLIED" || a.status === "AI_SCREENING").length,
    review: applications.filter(a => a.status === "HR_REVIEW").length,
    interview: applications.filter(a => a.status === "INTERVIEW").length,
    offer: applications.filter(a => a.status === "OFFER").length,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Đơn ứng tuyển của tôi"
        description="Theo dõi trạng thái pipeline và xem chi tiết AI score cho từng vị trí."
      />
      
      {applications.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Đã nộp", count: stats.applied, icon: <FileText size={20} />, color: "text-body", bg: "bg-canvas" },
            { label: "HR Đang xem", count: stats.review, icon: <Users size={20} />, color: "text-accent-cyan", bg: "bg-canvas-soft" },
            { label: "Phỏng vấn", count: stats.interview, icon: <Briefcase size={20} />, color: "text-ink-deep", bg: "bg-primary-neutral" },
            { label: "Đề nghị", count: stats.offer, icon: <CheckCircle2 size={20} />, color: "text-positive-deep", bg: "bg-primary-pale" },
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
              <ApplicationCard application={app} />
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
