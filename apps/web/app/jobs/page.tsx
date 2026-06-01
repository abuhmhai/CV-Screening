"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import { Job } from "../../lib/types";
import { JobCard } from "../../components/job-card";
import { Card, PageHeader } from "../../components/ui/card";
import { FieldLabel, Input, Select } from "../../components/ui/input";
import { EmptyState, LoadingBlock } from "../../components/ui/states";
import { Search, MapPin, Briefcase, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="space-y-8">
      <PageHeader
        title="Việc làm đang tuyển"
        description="Lọc theo kỹ năng, địa điểm, cấp bậc. Xem chi tiết JD và ứng tuyển trực tiếp."
      />

      <Card className="grid gap-5 md:grid-cols-4 items-end">
        <div className="relative">
          <FieldLabel label="Tìm kiếm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" size={18} />
              <Input
                className="pl-10"
                placeholder="Backend, React, ML..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </FieldLabel>
        </div>
        <div className="relative">
          <FieldLabel label="Địa điểm">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-mute z-10" size={18} />
              <Select className="pl-10" value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">Tất cả địa điểm</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </Select>
            </div>
          </FieldLabel>
        </div>
        <div className="relative">
          <FieldLabel label="Cấp bậc">
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-mute z-10" size={18} />
              <Select className="pl-10" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">Tất cả cấp bậc</option>
                <option value="MID">MID</option>
                <option value="SENIOR">SENIOR</option>
                <option value="JUNIOR">JUNIOR</option>
              </Select>
            </div>
          </FieldLabel>
        </div>
        <div className="flex h-12 items-center justify-center rounded-xl bg-primary-pale px-4 text-body-sm font-semibold text-positive-deep">
          {filtered.length} vị trí phù hợp
        </div>
      </Card>

      {recommendedJobs.length > 0 && (
        <section className="content-band rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-ink-deep" size={20} />
            <h2 className="text-xl font-semibold text-ink">Gợi ý phù hợp với bạn</h2>
          </div>
          <p className="text-body-sm text-body italic mb-6">
            Đề xuất dựa trên kỹ năng hồ sơ và tín hiệu matching.
          </p>
          <div className="grid gap-4 md:grid-cols-2 stagger-children">
            {recommendedJobs.map((job, i) => (
              <motion.div 
                key={`recommended-${job.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <JobCard job={job} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Tất cả việc làm</h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton h-40 w-full"></div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Không tìm thấy việc làm" description="Thử đổi bộ lọc hoặc quay lại sau." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 stagger-children">
            {filtered.map((job, i) => (
              <motion.div 
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (i % 6) * 0.1 }}
              >
                <JobCard job={job} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
