"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../lib/auth-context";
import { apiFetch, getApiBase } from "../../../lib/api-client";
import { Application, ApplicationStatus, Job } from "../../../lib/types";
import { formatScore, statusLabel } from "../../../lib/format";
import { AuthGate } from "../../../components/auth-gate";
import { PageHeader, Card } from "../../../components/ui/card";
import { StatusBadge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { FieldLabel, Input, Select } from "../../../components/ui/input";
import { StatCard } from "../../../components/stat-card";
import { ErrorBlock, LoadingBlock, ScoreBar, SkeletonList } from "../../../components/ui/states";

const pipelineStatuses: ApplicationStatus[] = ["APPLIED", "AI_SCREENING", "HR_REVIEW", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

function RecruiterDashboardContent() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortByScore, setSortByScore] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void apiFetch<Job[]>("/jobs").then((res) => {
      if (res.ok && res.data) {
        const active = res.data.filter((j) => j.status === "ACTIVE");
        setJobs(active);
        if (active[0]) setSelectedJobId(active[0].id);
      }
      setLoadingJobs(false);
    });
  }, []);

  useEffect(() => {
    if (!token || !selectedJobId) return;
    setLoadingApps(true);
    setError(null);
    void apiFetch<Application[]>(`/applications/job/${selectedJobId}`, { token }).then((res) => {
      if (res.ok && res.data) setApplications(res.data);
      else {
        setApplications([]);
        setError(res.error ?? "Không thể tải ứng viên cho job này");
      }
      setLoadingApps(false);
    });
  }, [token, selectedJobId]);

  const filtered = useMemo(() => {
    let list = [...applications];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.candidate?.profile?.fullName?.toLowerCase().includes(q) ||
          a.candidate?.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter((a) => a.status === statusFilter);
    if (sortByScore) {
      list.sort(
        (a, b) =>
          parseFloat(String(b.aiResult?.overallScore ?? 0)) -
          parseFloat(String(a.aiResult?.overallScore ?? 0))
      );
    }
    return list;
  }, [applications, search, statusFilter, sortByScore]);

  const stats = useMemo(() => {
    const scores = applications
      .map((a) => parseFloat(String(a.aiResult?.overallScore ?? 0)))
      .filter((n) => !Number.isNaN(n));
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const interview = applications.filter((a) =>
      ["INTERVIEW", "OFFER"].includes(a.status)
    ).length;
    return { total: applications.length, avg, interview };
  }, [applications]);

  const kanbanColumns = useMemo(() => {
    return pipelineStatuses.map((status) => ({
      status,
      items: filtered.filter((app) => app.status === status)
    }));
  }, [filtered]);

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    if (!token) return;
    setUpdatingId(applicationId);
    const res = await apiFetch(`/applications/${applicationId}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status, note: `Moved to ${status} from dashboard` })
    });
    setUpdatingId(null);
    if (res.ok) {
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
      );
    }
  }

  async function rescreen(applicationId: string) {
    if (!token) return;
    setUpdatingId(applicationId);
    const res = await apiFetch(`/applications/${applicationId}/rescreen`, {
      method: "POST",
      token
    });
    setUpdatingId(null);
    if (res.ok) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: "AI_SCREENING", aiResult: null } : app
        )
      );
      return;
    }
    setError(res.error ?? "Không thể chạy lại AI screening");
  }

  async function exportCsv(): Promise<void> {
    if (!token || !selectedJobId) return;
    setExporting(true);
    try {
      const response = await fetch(`${getApiBase()}/api/v1/applications/job/${selectedJobId}/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        setError("Không thể export danh sách ứng viên");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `applications-${selectedJobId}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      setError("Không thể export danh sách ứng viên");
    } finally {
      setExporting(false);
    }
  }

  if (loadingJobs) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruiter Dashboard"
        description="Pipeline tuyển dụng với AI score, lọc và chuyển trạng thái ứng viên."
        actions={
          <Link href="/recruiter/jobs/new">
            <Button className="px-4 py-2 text-sm">+ Đăng tin mới</Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Ứng viên" value={String(stats.total)} />
        <StatCard label="Avg AI Score" value={stats.avg.toFixed(1)} tone="positive" />
        <StatCard label="Interview+" value={String(stats.interview)} tone="warning" />
        <StatCard label="Jobs active" value={String(jobs.length)} />
      </div>

      <Card className="grid gap-4 md:grid-cols-4">
        <FieldLabel label="Job posting">
          <Select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} · {job.company?.name}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="Tìm ứng viên">
          <Input placeholder="Tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </FieldLabel>
        <FieldLabel label="Trạng thái">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả</option>
            {pipelineStatuses.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="Sắp xếp">
          <Select
            value={sortByScore ? "score" : "date"}
            onChange={(e) => setSortByScore(e.target.value === "score")}
          >
            <option value="score">AI Score cao → thấp</option>
            <option value="date">Mới nhất</option>
          </Select>
        </FieldLabel>
        <div className="flex justify-end md:col-span-4">
          <Button
            variant="secondary"
            className="px-4 py-2 text-sm"
            disabled={!selectedJobId || exporting}
            onClick={() => void exportCsv()}
          >
            {exporting ? "Đang export..." : "Export CSV"}
          </Button>
        </div>
      </Card>

      {error ? <ErrorBlock message={error} /> : null}
      {loadingApps ? (
        <SkeletonList count={4} />
      ) : (
        <>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
            <table className="min-w-[760px] text-sm">
            <thead className="border-b border-ink/10 bg-canvas-soft text-left text-xs uppercase tracking-wide text-body">
              <tr>
                <th className="px-4 py-3">Ứng viên</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">AI Score</th>
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => {
                const score = parseFloat(String(app.aiResult?.overallScore ?? 0));
                return (
                  <tr key={app.id} className="border-b border-ink/5 transition hover:bg-canvas-soft/60">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-ink">{app.candidate?.profile?.fullName ?? app.candidate?.email}</p>
                      <p className="text-xs text-mute">{app.candidate?.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-4 font-black">{formatScore(score)}</td>
                    <td className="w-48 px-4 py-4">
                      <ScoreBar label="" value={score} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/ai-score/${app.id}`}>
                          <Button variant="secondary" className="px-3 py-1 text-xs">
                            Score
                          </Button>
                        </Link>
                        <Button
                          variant="secondary"
                          className="px-3 py-1 text-xs"
                          disabled={updatingId === app.id}
                          onClick={() => void rescreen(app.id)}
                        >
                          Re-screen
                        </Button>
                        <Select
                          className="!mt-0 !w-auto !py-1 text-xs"
                          value={app.status}
                          disabled={updatingId === app.id}
                          onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}
                        >
                          {pipelineStatuses.map((s) => (
                            <option key={s} value={s}>
                              {statusLabel(s)}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
            </div>
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-body">Không có ứng viên phù hợp bộ lọc.</p>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Pipeline board</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {kanbanColumns.map((column) => (
                <div key={column.status} className="rounded-xl bg-canvas-soft p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">{statusLabel(column.status)}</span>
                    <StatusBadge status={column.status} />
                  </div>
                  <div className="space-y-2">
                    {column.items.slice(0, 6).map((app) => (
                      <div key={app.id} className="rounded-lg bg-canvas p-3 shadow-[0_1px_0_rgba(14,15,12,0.04)]">
                        <p className="text-sm font-semibold">
                          {app.candidate?.profile?.fullName ?? app.candidate?.email}
                        </p>
                        <p className="text-xs text-mute">
                          AI {formatScore(app.aiResult?.overallScore ?? 0)}
                        </p>
                        <div className="mt-2">
                          <Select
                            className="!mt-0 !py-1 text-xs"
                            value={app.status}
                            onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}
                            disabled={updatingId === app.id}
                          >
                            {pipelineStatuses.map((s) => (
                              <option key={s} value={s}>
                                {statusLabel(s)}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    ))}
                    {column.items.length === 0 ? (
                      <p className="rounded-md bg-canvas px-3 py-2 text-xs text-mute">Chưa có ứng viên</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default function RecruiterDashboardPage() {
  return (
    <AuthGate roles={["RECRUITER", "ADMIN"]}>
      <RecruiterDashboardContent />
    </AuthGate>
  );
}
