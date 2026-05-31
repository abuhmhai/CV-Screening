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
      <div className="space-y-4">
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
      </div>
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
    <div className="space-y-6">
      <PageHeader
        title="Chi tiết AI Score"
        description={`${application.job?.title} · ${application.job?.company?.name}`}
        actions={<StatusBadge status={application.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="text-center">
          <p className="text-sm font-semibold text-mute">Điểm matching tổng thể</p>
          <p className="mt-2 font-display text-5xl font-black leading-none text-ink sm:text-display-xl">{formatScore(overall)}</p>
          <Badge tone="positive" className="mt-3">
            Grade {ai.grade ?? "—"}
          </Badge>
          {ai.processingTimeMs ? (
            <p className="mt-4 text-xs text-mute">Xử lý trong {ai.processingTimeMs}ms</p>
          ) : null}
          {ai.explanation ? (
            <p className="mt-6 text-left text-sm text-body">{ai.explanation}</p>
          ) : null}
        </Card>

        <Card className="space-y-5">
          <h2 className="text-lg font-semibold">Chi tiết điểm</h2>
          <ScoreBar label="Skills (40%)" value={parseFloat(String(ai.skillScore ?? 0))} />
          <ScoreBar label="Experience (30%)" value={parseFloat(String(ai.experienceScore ?? 0))} />
          <ScoreBar label="Education (20%)" value={parseFloat(String(ai.educationScore ?? 0))} />
          <ScoreBar label="Other (10%)" value={parseFloat(String(ai.otherScore ?? 0))} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-ink-deep">Kỹ năng phù hợp</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(ai.matchedSkills ?? []).map((skill) => (
              <Badge key={skill} tone="positive">
                {skill}
              </Badge>
            ))}
          </div>
          <h3 className="mt-6 text-lg font-semibold text-negative">Kỹ năng còn thiếu</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {(ai.missingSkills ?? []).length > 0 ? (
              ai.missingSkills!.map((skill) => (
                <Badge key={skill} tone="negative">
                  {skill}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-body">Không có khoảng trống kỹ năng lớn</span>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Nhận xét</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink-deep">Điểm mạnh</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-body">
                {(ai.strengths ?? []).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            {(ai.concerns ?? []).length > 0 ? (
              <div>
                <p className="text-sm font-semibold text-negative">Lưu ý</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-body">
                  {ai.concerns!.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <label className="mt-6 flex items-start gap-3 rounded-lg bg-canvas-soft p-4 text-sm">
            <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />
            <span>Tôi đã xem xét kết quả AI và hiểu đây là gợi ý hỗ trợ, không thay thế quyết định của con người.</span>
          </label>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {canManage ? (
              <Button
                disabled={!reviewed || actionLoading}
                className="px-4 py-2 text-sm"
                onClick={() => void moveToInterview()}
              >
                {actionLoading ? "Đang cập nhật..." : "Chuyển sang phỏng vấn"}
              </Button>
            ) : null}
            <Link href={`/applications/${application.id}`}>
              <Button variant="secondary" className="px-4 py-2 text-sm">
                Quay lại đơn
              </Button>
            </Link>
          </div>
          {actionMessage ? <p className="mt-3 text-sm text-body">{actionMessage}</p> : null}
        </Card>
      </div>
    </div>
  );
}

export default function AiScorePage() {
  return (
    <AuthGate roles={["CANDIDATE", "RECRUITER", "ADMIN"]}>
      <AiScoreContent />
    </AuthGate>
  );
}
