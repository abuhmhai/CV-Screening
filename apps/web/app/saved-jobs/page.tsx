"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { JobAlert, SavedJob } from "../../lib/types";
import { AuthGate } from "../../components/auth-gate";
import { JobCard } from "../../components/job-card";
import { Card, PageHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { FieldLabel, Input, Select } from "../../components/ui/input";
import { EmptyState, LoadingBlock } from "../../components/ui/states";
import { Bell, Bookmark, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function SavedJobsContent() {
  const { token } = useAuth();
  const [tab, setTab] = useState<"saved" | "alerts">("saved");
  const [saved, setSaved] = useState<SavedJob[]>([]);
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [frequency, setFrequency] = useState<JobAlert["frequency"]>("DAILY");

  const loadSaved = () => {
    if (!token) return;
    void apiFetch<SavedJob[]>("/users/me/saved-jobs", { token }).then((res) => {
      if (res.ok && res.data) setSaved(res.data);
      setLoading(false);
    });
  };

  const loadAlerts = () => {
    if (!token) return;
    void apiFetch<JobAlert[]>("/job-alerts", { token }).then((res) => {
      if (res.ok && res.data) setAlerts(res.data);
    });
  };

  useEffect(() => {
    loadSaved();
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!keyword.trim() && !location.trim()) {
      toast.error("Nhập từ khoá hoặc địa điểm cho thông báo");
      return;
    }
    const res = await apiFetch<JobAlert>("/job-alerts", {
      method: "POST",
      token,
      body: JSON.stringify({
        keyword: keyword.trim() || undefined,
        filters: location.trim() ? { location: location.trim() } : {},
        frequency
      })
    });
    if (res.ok) {
      toast.success("Đã tạo thông báo việc làm");
      setKeyword("");
      setLocation("");
      loadAlerts();
    } else {
      toast.error(res.error ?? "Không tạo được thông báo");
    }
  };

  const toggleAlert = async (alert: JobAlert) => {
    if (!token) return;
    const res = await apiFetch<JobAlert>(`/job-alerts/${alert.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ isActive: !alert.isActive })
    });
    if (res.ok) loadAlerts();
  };

  const deleteAlert = async (id: string) => {
    if (!token) return;
    const res = await apiFetch(`/job-alerts/${id}`, { method: "DELETE", token });
    if (res.ok) {
      toast.success("Đã xoá thông báo");
      loadAlerts();
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Việc làm đã lưu & Thông báo"
        description="Quản lý các tin tuyển dụng bạn quan tâm và đăng ký nhận thông báo việc làm mới."
      />

      <div className="flex gap-2 border-b border-ink/10">
        <button
          type="button"
          onClick={() => setTab("saved")}
          className={`flex items-center gap-2 px-4 py-3 text-body-sm font-semibold transition ${
            tab === "saved"
              ? "border-b-2 border-positive-deep text-positive-deep"
              : "text-mute hover:text-ink"
          }`}
        >
          <Bookmark size={16} /> Đã lưu ({saved.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("alerts")}
          className={`flex items-center gap-2 px-4 py-3 text-body-sm font-semibold transition ${
            tab === "alerts"
              ? "border-b-2 border-positive-deep text-positive-deep"
              : "text-mute hover:text-ink"
          }`}
        >
          <Bell size={16} /> Thông báo ({alerts.length})
        </button>
      </div>

      {tab === "saved" ? (
        loading ? (
          <LoadingBlock />
        ) : saved.length === 0 ? (
          <EmptyState
            title="Chưa lưu việc làm nào"
            description="Nhấn biểu tượng bookmark trên tin tuyển dụng để lưu lại."
            actionLabel="Khám phá việc làm"
            actionHref="/jobs"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {saved.map((s) => (
              <JobCard key={s.jobId} job={s.job} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <Card>
            <form onSubmit={createAlert} className="grid gap-4 md:grid-cols-[1fr_1fr_180px_auto] md:items-end">
              <FieldLabel label="Từ khoá">
                <Input
                  placeholder="React, Backend..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </FieldLabel>
              <FieldLabel label="Địa điểm">
                <Input
                  placeholder="Hà Nội, HCM..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </FieldLabel>
              <FieldLabel label="Tần suất">
                <Select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as JobAlert["frequency"])}
                >
                  <option value="INSTANT">Tức thì</option>
                  <option value="DAILY">Hàng ngày</option>
                  <option value="WEEKLY">Hàng tuần</option>
                </Select>
              </FieldLabel>
              <Button type="submit" variant="primary" leftIcon={<Plus size={16} />}>
                Tạo
              </Button>
            </form>
          </Card>

          {alerts.length === 0 ? (
            <EmptyState
              title="Chưa có thông báo việc làm"
              description="Tạo thông báo để nhận việc làm mới phù hợp ngay khi được đăng."
            />
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card key={alert.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">
                      {alert.keyword || "Tất cả việc làm"}
                      {alert.filters?.location ? ` · ${String(alert.filters.location)}` : ""}
                    </p>
                    <p className="text-caption text-mute">
                      Tần suất: {alert.frequency} · {alert.isActive ? "Đang bật" : "Đã tắt"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => toggleAlert(alert)} className="min-h-10 px-4 py-2">
                      {alert.isActive ? "Tắt" : "Bật"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => deleteAlert(alert.id)}
                      className="rounded-lg p-2 text-negative transition hover:bg-negative-bg/10"
                      aria-label="Xoá thông báo"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SavedJobsPage() {
  return (
    <AuthGate roles={["CANDIDATE", "RECRUITER", "ADMIN"]}>
      <SavedJobsContent />
    </AuthGate>
  );
}
