"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { ExternalJob, Paginated, UserProfile } from "../../lib/types";
import { PageHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { LoadingBlock } from "../../components/ui/states";
import {
  ExternalJobFilters,
  JobFilters,
  emptyExternalJobFilters
} from "../../components/external-jobs/job-filters";
import { MobileFilterDrawer } from "../../components/external-jobs/mobile-filter-drawer";
import { JobList } from "../../components/external-jobs/job-list";
import { CvScreeningPanel } from "../../components/external-jobs/cv-screening-panel";
import { JobSummaryPanel } from "../../components/external-jobs/job-summary-panel";
import { SyncProgressModal, SyncResult } from "../../components/external-jobs/sync-progress-modal";

function ExternalJobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (user?.role === "RECRUITER" || user?.role === "ADMIN")) {
      router.replace("/recruiter/dashboard");
    }
  }, [user, authLoading, router]);

  // Initialize state from URL query parameters
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 12;
  const initialFilters: ExternalJobFilters = {
    source: searchParams.get("source") || "",
    keyword: searchParams.get("keyword") || "",
    location: searchParams.get("location") || "",
    level: searchParams.get("level") || "",
    savedOnly: searchParams.get("savedOnly") === "true"
  };

  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ExternalJobFilters>(initialFilters);
  const [selectedJob, setSelectedJob] = useState<ExternalJob | null>(null);
  const [summaryJob, setSummaryJob] = useState<ExternalJob | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // User candidate skills & saved job IDs
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // In-memory cache for fast back/forward navigation
  const cacheRef = useRef<Map<string, Paginated<ExternalJob>>>(new Map());

  // Load user's profile skills for Quick Match
  useEffect(() => {
    if (!token || !user) return;
    void apiFetch<UserProfile>(`/users/${user.id}/profile`, { token }).then((res) => {
      if (res.ok && res.data?.userSkills) {
        const skills = res.data.userSkills.map((s) => s.skill.name).filter(Boolean);
        setUserSkills(skills);
      }
    });
  }, [token, user]);

  // Load user's saved external job IDs
  const loadSavedIds = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch<string[]>("/external-jobs/saved/ids", { token });
    if (res.ok && res.data) {
      setSavedIds(new Set(res.data));
    }
  }, [token]);

  useEffect(() => {
    void loadSavedIds();
  }, [loadSavedIds]);

  // Main load function
  const load = useCallback(
    async (f: ExternalJobFilters, p: number, l: number) => {
      const params = new URLSearchParams();
      if (f.source) params.set("source", f.source);
      if (f.keyword) params.set("keyword", f.keyword);
      if (f.location) params.set("location", f.location);
      if (f.level) params.set("level", f.level);
      if (f.savedOnly) params.set("savedOnly", "true");
      params.set("page", String(p));
      params.set("limit", String(l));

      const queryStr = params.toString();
      // Update browser URL without reloading
      router.replace(`/external-jobs?${queryStr}`, { scroll: false });

      const cacheKey = `${queryStr}:${f.savedOnly ? user?.id : "public"}`;
      const cached = cacheRef.current.get(cacheKey);

      if (cached) {
        setJobs(cached.items);
        setTotal(cached.pagination.total);
        setTotalPages(cached.pagination.totalPages);
        setPage(cached.pagination.page);
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await apiFetch<Paginated<ExternalJob>>(`/external-jobs?${queryStr}`, {
        token: token ?? undefined
      });

      if (res.ok && res.data) {
        cacheRef.current.set(cacheKey, res.data);
        setJobs(res.data.items);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
        setPage(res.data.pagination.page);
      }
      setLoading(false);
    },
    [router, token, user?.id]
  );

  // Trigger load whenever filters change
  useEffect(() => {
    void load(filters, 1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, limit]);

  const onFilterChange = <K extends keyof ExternalJobFilters>(key: K, next: ExternalJobFilters[K]) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: next }));
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    void load(filters, nextPage, limit);
    const el = document.getElementById("external-jobs-results");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
    void load(filters, 1, nextLimit);
  };

  const handleToggleSave = async (jobId: string) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để lưu việc làm");
      return;
    }

    const isCurrentlySaved = savedIds.has(jobId);
    // Optimistic state update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) next.delete(jobId);
      else next.add(jobId);
      return next;
    });

    const res = await apiFetch<{ saved: boolean }>(`/external-jobs/${jobId}/save`, {
      method: "POST",
      token
    });

    if (res.ok && res.data) {
      if (res.data.saved) {
        toast.success("Đã lưu việc làm vào danh sách theo dõi");
      } else {
        toast.success("Đã bỏ lưu việc làm");
      }
      // If currently filtering by savedOnly, clear cache so list refreshes
      if (filters.savedOnly) {
        cacheRef.current.clear();
        void load(filters, page, limit);
      }
    } else {
      // Revert optimistic update on failure
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.add(jobId);
        else next.delete(jobId);
        return next;
      });
      toast.error(res.error || "Không thể cập nhật trạng thái lưu việc làm");
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setIsSyncModalOpen(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const res = await apiFetch<SyncResult>("/external-jobs/sync", {
        method: "POST",
        token: token ?? undefined
      });
      if (res.ok && res.data) {
        setSyncResult(res.data);
        cacheRef.current.clear();
        await load(filters, 1, limit);
      } else {
        setSyncError(res.error || "Không thể đồng bộ dữ liệu lúc này");
      }
    } catch {
      setSyncError("Lỗi kết nối máy chủ đồng bộ");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Việc làm tổng hợp"
        description="Tin tuyển dụng công nghệ được cào và tổng hợp tự động từ ITviec, TopCV, VietnamWorks, CareerViet. Dán CV để AI chấm độ phù hợp trước khi ứng tuyển."
        actions={
          <Button
            variant="secondary"
            onClick={handleSync}
            disabled={isSyncing}
            leftIcon={<RefreshCw size={16} className={isSyncing ? "animate-spin text-primary" : ""} />}
            className="shrink-0"
          >
            {isSyncing ? "Đang cào dữ liệu mới..." : "Cập nhật việc làm mới"}
          </Button>
        }
      />

      {/* Mobile Drawer Filter toolbar */}
      <MobileFilterDrawer
        value={filters}
        onChange={onFilterChange}
        onReset={() => setFilters(emptyExternalJobFilters)}
        isLoggedIn={Boolean(user)}
        savedCount={savedIds.size}
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Desktop Sidebar Filter */}
        <aside className="hidden lg:block">
          <JobFilters
            value={filters}
            onChange={onFilterChange}
            onReset={() => setFilters(emptyExternalJobFilters)}
            isLoggedIn={Boolean(user)}
            savedCount={savedIds.size}
          />
        </aside>

        <div className="space-y-5">
          <div className="flex items-center gap-2 text-body-sm font-semibold text-ink">
            <Globe2 size={16} className="text-mute" />
            <span>
              {filters.savedOnly
                ? `${total} việc làm đã lưu`
                : `${total} vị trí tổng hợp`}
            </span>
          </div>

          <JobList
            jobs={jobs}
            loading={loading}
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onScreen={setSelectedJob}
            onSummarize={setSummaryJob}
            userSkills={userSkills}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
          />
        </div>
      </div>

      <CvScreeningPanel job={selectedJob} onClose={() => setSelectedJob(null)} />
      <JobSummaryPanel job={summaryJob} onClose={() => setSummaryJob(null)} />
      <SyncProgressModal
        isOpen={isSyncModalOpen}
        isSyncing={isSyncing}
        result={syncResult}
        error={syncError}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
}

export default function ExternalJobsPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <ExternalJobsContent />
    </Suspense>
  );
}

