"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe2 } from "lucide-react";
import { apiFetch } from "../../lib/api-client";
import { ExternalJob, Paginated } from "../../lib/types";
import { PageHeader } from "../../components/ui/card";
import {
  ExternalJobFilters,
  JobFilters,
  emptyExternalJobFilters
} from "../../components/external-jobs/job-filters";
import { JobList } from "../../components/external-jobs/job-list";
import { CvScreeningPanel } from "../../components/external-jobs/cv-screening-panel";
import { JobSummaryPanel } from "../../components/external-jobs/job-summary-panel";

const PAGE_SIZE = 12;

export default function ExternalJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ExternalJobFilters>(emptyExternalJobFilters);
  const [selectedJob, setSelectedJob] = useState<ExternalJob | null>(null);
  const [summaryJob, setSummaryJob] = useState<ExternalJob | null>(null);

  const load = useCallback(async (f: ExternalJobFilters, p: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.source) params.set("source", f.source);
    if (f.keyword) params.set("keyword", f.keyword);
    if (f.location) params.set("location", f.location);
    if (f.level) params.set("level", f.level);
    params.set("page", String(p));
    params.set("limit", String(PAGE_SIZE));

    // Reflect the current query in the URL (no reload).
    router.replace(`/external-jobs?${params.toString()}`, { scroll: false });

    const res = await apiFetch<Paginated<ExternalJob>>(`/external-jobs?${params.toString()}`);
    if (res.ok && res.data) {
      setJobs(res.data.items);
      setTotal(res.data.pagination.total);
      setTotalPages(res.data.pagination.totalPages);
      setPage(res.data.pagination.page);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load(filters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const onChange = <K extends keyof ExternalJobFilters>(key: K, next: ExternalJobFilters[K]) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: next }));
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Việc làm tổng hợp"
        description="Tin tuyển dụng được tổng hợp từ TopCV và VietnamWorks. Dán CV để AI chấm độ phù hợp trước khi ứng tuyển."
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <JobFilters value={filters} onChange={onChange} onReset={() => setFilters(emptyExternalJobFilters)} />
        </aside>

        <div className="space-y-5">
          <div className="flex items-center gap-2 text-body-sm font-semibold text-ink">
            <Globe2 size={16} className="text-mute" /> {total} vị trí tổng hợp
          </div>
          <JobList
            jobs={jobs}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={(next) => void load(filters, next)}
            onScreen={setSelectedJob}
            onSummarize={setSummaryJob}
          />
        </div>
      </div>

      <CvScreeningPanel job={selectedJob} onClose={() => setSelectedJob(null)} />
      <JobSummaryPanel job={summaryJob} onClose={() => setSummaryJob(null)} />
    </div>
  );
}
