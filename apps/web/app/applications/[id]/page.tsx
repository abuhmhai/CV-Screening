"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { apiFetch } from "../../../lib/api-client";
import { Application } from "../../../lib/types";
import { formatDate, formatDateTime, formatScore, statusLabel } from "../../../lib/format";
import { AuthGate } from "../../../components/auth-gate";
import { PageHeader, Card } from "../../../components/ui/card";
import { StatusBadge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { ErrorBlock, LoadingBlock } from "../../../components/ui/states";

function ApplicationDetailContent() {
  const params = useParams<{ id: string }>();
  const { token } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    void apiFetch<Application>(`/applications/${params.id}`, { token }).then((res) => {
      if (res.ok && res.data) setApplication(res.data);
      setLoading(false);
    });
  }, [token, params.id]);

  if (loading) return <LoadingBlock />;
  if (!application) return <ErrorBlock message="Không tìm thấy đơn ứng tuyển" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={application.job?.title ?? "Chi tiết ứng tuyển"}
        description={`${application.job?.company?.name} · Nộp ${formatDate(application.appliedAt)}`}
        actions={
          <div className="flex gap-2">
            <StatusBadge status={application.status} />
            {application.aiResult ? (
              <Link href={`/ai-score/${application.id}`}>
                <Button className="px-4 py-2 text-sm">AI Score</Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Thông tin ứng tuyển</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-ink/5 pb-2">
              <dt className="text-mute">Trạng thái</dt>
              <dd className="font-semibold">{statusLabel(application.status)}</dd>
            </div>
            <div className="flex justify-between border-b border-ink/5 pb-2">
              <dt className="text-mute">Vị trí</dt>
              <dd>{application.job?.location ?? "Remote"}</dd>
            </div>
            <div className="flex justify-between border-b border-ink/5 pb-2">
              <dt className="text-mute">AI Score</dt>
              <dd className="font-black">{formatScore(application.aiResult?.overallScore)}</dd>
            </div>
          </dl>
          {application.coverLetter ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Thư giới thiệu</h3>
              <p className="mt-2 text-sm text-body">{application.coverLetter}</p>
            </div>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Lịch sử trạng thái</h2>
          <ul className="mt-4 space-y-3">
            {(application.statusHistory ?? []).map((item) => (
              <li key={item.id} className="rounded-lg bg-canvas-soft px-4 py-3 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>
                    {statusLabel(item.fromStatus)} → {statusLabel(item.toStatus)}
                  </span>
                  <span className="text-mute">{formatDateTime(item.changedAt)}</span>
                </div>
                {item.note ? <p className="mt-1 text-body">{item.note}</p> : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default function ApplicationDetailPage() {
  return (
    <AuthGate roles={["CANDIDATE", "RECRUITER", "ADMIN"]}>
      <ApplicationDetailContent />
    </AuthGate>
  );
}
