"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { Application } from "../../lib/types";
import { AuthGate } from "../../components/auth-gate";
import { ApplicationCard } from "../../components/application-card";
import { PageHeader } from "../../components/ui/card";
import { EmptyState, ErrorBlock, LoadingBlock } from "../../components/ui/states";

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn ứng tuyển của tôi"
        description="Theo dõi trạng thái pipeline và xem chi tiết AI score cho từng vị trí."
      />
      {applications.length === 0 ? (
        <EmptyState
          title="Chưa có đơn ứng tuyển"
          description="Khám phá việc làm và nộp hồ sơ để nhận điểm AI."
          actionLabel="Xem việc làm"
          actionHref="/jobs"
        />
      ) : (
        applications.map((app) => <ApplicationCard key={app.id} application={app} />)
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
