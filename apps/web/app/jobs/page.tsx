"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import { Job, JobFacets, Paginated } from "../../lib/types";
import { JobCard } from "../../components/job-card";
import { Card, PageHeader } from "../../components/ui/card";
import { FieldLabel, Input, Select } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/states";
import { Search, MapPin, Sparkles, SlidersHorizontal, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface Filters {
  keyword: string;
  location: string;
  jobType: string;
  level: string;
  category: string;
  isRemote: boolean;
  salaryMin: string;
  salaryMax: string;
  sort: "newest" | "salary" | "relevance";
}

const emptyFilters: Filters = {
  keyword: "",
  location: "",
  jobType: "",
  level: "",
  category: "",
  isRemote: false,
  salaryMin: "",
  salaryMax: "",
  sort: "newest"
};

export default function JobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [facets, setFacets] = useState<JobFacets | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [draftKeyword, setDraftKeyword] = useState("");

  const runSearch = useCallback(
    async (f: Filters, p: number) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (f.keyword) params.set("keyword", f.keyword);
      if (f.location) params.set("location", f.location);
      if (f.jobType) params.set("jobType", f.jobType);
      if (f.level) params.set("level", f.level);
      if (f.category) params.set("category", f.category);
      if (f.isRemote) params.set("isRemote", "true");
      if (f.salaryMin) params.set("salaryMin", f.salaryMin);
      if (f.salaryMax) params.set("salaryMax", f.salaryMax);
      params.set("sort", f.sort);
      params.set("page", String(p));
      params.set("pageSize", "12");

      const res = await apiFetch<Paginated<Job>>(`/jobs/search?${params.toString()}`);
      if (res.ok && res.data) {
        setJobs(res.data.items);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
        setPage(res.data.pagination.page);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    void apiFetch<JobFacets>("/jobs/facets").then((res) => {
      if (res.ok && res.data) setFacets(res.data);
    });
  }, []);

  useEffect(() => {
    void runSearch(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (!token) {
      setRecommendedJobs([]);
      return;
    }
    void apiFetch<Job[]>("/recommendations/jobs?limit=4", { token }).then((res) => {
      if (res.ok && res.data) setRecommendedJobs(res.data);
    });
  }, [token]);

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    update("keyword", draftKeyword.trim());
  };

  const reset = () => {
    setDraftKeyword("");
    setPage(1);
    setFilters(emptyFilters);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Việc làm đang tuyển"
        description="Lọc theo kỹ năng, địa điểm, lương và cấp bậc. Tìm kiếm nâng cao như TopCV."
      />

      <form onSubmit={applyKeyword}>
        <Card className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <FieldLabel label="Tìm kiếm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" size={18} />
                <Input
                  className="pl-10"
                  placeholder="Backend, React, Data Engineer..."
                  value={draftKeyword}
                  onChange={(e) => setDraftKeyword(e.target.value)}
                />
              </div>
            </FieldLabel>
          </div>
          <div className="w-full md:w-56">
            <FieldLabel label="Địa điểm">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-mute z-10" size={18} />
                <Input
                  className="pl-10"
                  placeholder="Hà Nội, HCM..."
                  value={filters.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </div>
            </FieldLabel>
          </div>
          <Button type="submit" variant="primary" className="min-h-12 px-6">
            Tìm kiếm
          </Button>
        </Card>
      </form>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-5">
          <Card className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <SlidersHorizontal size={18} /> Bộ lọc
              </div>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1 text-caption text-mute transition hover:text-ink"
              >
                <RotateCcw size={14} /> Đặt lại
              </button>
            </div>

            <FieldLabel label="Cấp bậc">
              <Select value={filters.level} onChange={(e) => update("level", e.target.value)}>
                <option value="">Tất cả</option>
                {(facets?.levels.length
                  ? facets.levels.map((l) => l.value)
                  : ["JUNIOR", "MID", "SENIOR"]
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </FieldLabel>

            <FieldLabel label="Loại hình">
              <Select value={filters.jobType} onChange={(e) => update("jobType", e.target.value)}>
                <option value="">Tất cả</option>
                {(facets?.jobTypes.length
                  ? facets.jobTypes.map((t) => t.value)
                  : ["FULL_TIME", "HYBRID", "REMOTE"]
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </FieldLabel>

            <FieldLabel label="Ngành">
              <Select value={filters.category} onChange={(e) => update("category", e.target.value)}>
                <option value="">Tất cả</option>
                {(facets?.categories ?? []).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value} ({c.count})
                  </option>
                ))}
              </Select>
            </FieldLabel>

            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label="Lương từ">
                <Input
                  type="number"
                  min={0}
                  placeholder="1000"
                  value={filters.salaryMin}
                  onChange={(e) => update("salaryMin", e.target.value)}
                />
              </FieldLabel>
              <FieldLabel label="Đến">
                <Input
                  type="number"
                  min={0}
                  placeholder="5000"
                  value={filters.salaryMax}
                  onChange={(e) => update("salaryMax", e.target.value)}
                />
              </FieldLabel>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/10 px-4 py-3 text-body-sm">
              <input
                type="checkbox"
                checked={filters.isRemote}
                onChange={(e) => update("isRemote", e.target.checked)}
                className="h-4 w-4 accent-positive-deep"
              />
              Chỉ việc làm Remote
            </label>
          </Card>
        </aside>

        <div className="space-y-5">
          {recommendedJobs.length > 0 && (
            <section className="content-band rounded-xl p-6">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="text-ink-deep" size={20} />
                <h2 className="text-xl font-semibold text-ink">Gợi ý phù hợp với bạn</h2>
              </div>
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-body-sm font-semibold text-ink">{total} vị trí phù hợp</span>
            <div className="flex items-center gap-2">
              <span className="text-caption text-mute">Sắp xếp:</span>
              <Select
                className="h-10 w-auto"
                value={filters.sort}
                onChange={(e) => update("sort", e.target.value as Filters["sort"])}
              >
                <option value="newest">Mới nhất</option>
                <option value="salary">Lương cao nhất</option>
                <option value="relevance">Phổ biến</option>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-40 w-full" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState title="Không tìm thấy việc làm" description="Thử đổi bộ lọc hoặc quay lại sau." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 stagger-children">
              {jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (i % 6) * 0.08 }}
                >
                  <JobCard job={job} />
                </motion.div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="tertiary"
                disabled={page <= 1}
                onClick={() => runSearch(filters, page - 1)}
              >
                Trước
              </Button>
              <span className="text-body-sm text-body">
                Trang {page}/{totalPages}
              </span>
              <Button
                variant="tertiary"
                disabled={page >= totalPages}
                onClick={() => runSearch(filters, page + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
