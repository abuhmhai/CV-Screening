"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import { Job } from "../../lib/types";
import { JobCard } from "../../components/job-card";
import { Card, PageHeader } from "../../components/ui/card";
import { FieldLabel, Input, Select } from "../../components/ui/input";
import { EmptyState, LoadingBlock } from "../../components/ui/states";

export default function JobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    void apiFetch<Job[]>("/jobs").then((res) => {
      if (res.ok && res.data) setJobs(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!token) {
      setRecommendedJobs([]);
      return;
    }
    void apiFetch<Job[]>("/recommendations/jobs?limit=4", { token }).then((res) => {
      if (res.ok && res.data) {
        setRecommendedJobs(res.data);
      }
    });
  }, [token]);

  const locations = useMemo(
    () => [...new Set(jobs.map((j) => j.location).filter(Boolean))] as string[],
    [jobs]
  );

  const filtered = jobs.filter((job) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      job.title.toLowerCase().includes(q) ||
      job.company?.name?.toLowerCase().includes(q) ||
      job.requiredSkills?.some((s) => s.toLowerCase().includes(q));
    const matchLocation = !location || job.location === location;
    const matchLevel = !level || job.level === level;
    return matchSearch && matchLocation && matchLevel && job.status === "ACTIVE";
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Việc làm đang tuyển"
        description="Lọc theo kỹ năng, địa điểm, cấp bậc. Xem chi tiết JD và ứng tuyển trực tiếp."
      />

      <div className="grid gap-4 rounded-xl bg-canvas p-6 md:grid-cols-4">
        <FieldLabel label="Tìm kiếm">
          <Input
            placeholder="Backend, React, ML..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FieldLabel>
        <FieldLabel label="Địa điểm">
          <Select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">Tất cả</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="Cấp bậc">
          <Select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="MID">MID</option>
            <option value="SENIOR">SENIOR</option>
            <option value="JUNIOR">JUNIOR</option>
          </Select>
        </FieldLabel>
        <div className="flex items-end">
          <p className="rounded-lg bg-canvas-soft px-4 py-3 text-sm font-semibold text-ink">
            {filtered.length} vị trí
          </p>
        </div>
      </div>

      {recommendedJobs.length > 0 ? (
        <Card>
          <h2 className="text-lg font-semibold">Recommended for you</h2>
          <p className="mt-1 text-sm text-body">
            Đề xuất dựa trên kỹ năng hồ sơ và tín hiệu matching.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {recommendedJobs.map((job) => (
              <JobCard key={`recommended-${job.id}`} job={job} />
            ))}
          </div>
        </Card>
      ) : null}

      {loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState title="Không tìm thấy việc làm" description="Thử đổi bộ lọc hoặc quay lại sau." />
      ) : (
        filtered.map((job) => <JobCard key={job.id} job={job} />)
      )}
    </div>
  );
}
