"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { ExternalJob } from "../../lib/types";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/states";
import { ExternalJobCard } from "./job-card";

function getPageNumbers(current: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }
  if (current >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "...", current - 1, current, current + 1, "...", totalPages];
}

export function JobList({
  jobs,
  loading,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  onScreen,
  onSummarize,
  userSkills = [],
  savedIds = new Set(),
  onToggleSave
}: {
  jobs: ExternalJob[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (next: number) => void;
  onLimitChange?: (limit: number) => void;
  onScreen: (job: ExternalJob) => void;
  onSummarize: (job: ExternalJob) => void;
  userSkills?: string[];
  savedIds?: Set<string>;
  onToggleSave?: (jobId: string) => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton h-60 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy việc làm phù hợp"
        description="Thử điều chỉnh lại từ khoá, địa điểm, cấp bậc hoặc bỏ bộ lọc 'Đã lưu' để có thêm kết quả."
      />
    );
  }

  const start = total > 0 ? (page - 1) * limit + 1 : 0;
  const end = Math.min(page * limit, total);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div id="external-jobs-results" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-body-sm text-mute">
        <span>
          Hiển thị <strong className="text-ink">{start}</strong>–<strong className="text-ink">{end}</strong> trong tổng số <strong className="text-ink">{total}</strong> việc làm
        </span>
        {onLimitChange ? (
          <div className="flex items-center gap-2">
            <span className="text-caption">Mỗi trang:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              aria-label="Số lượng tin mỗi trang"
              className="rounded-md border border-hairline-strong bg-surface-card px-2.5 py-1 text-caption font-medium text-ink transition hover:border-hairline focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={12}>12 tin</option>
              <option value={24}>24 tin</option>
              <option value={36}>36 tin</option>
            </select>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 stagger-children">
        {jobs.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: (i % 6) * 0.05 }}
          >
            <ExternalJobCard
              job={job}
              onScreen={onScreen}
              onSummarize={onSummarize}
              userSkills={userSkills}
              isSaved={savedIds.has(job.id)}
              onToggleSave={onToggleSave}
            />
          </motion.div>
        ))}
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Phân trang việc làm" className="flex flex-wrap items-center justify-center gap-1.5 pt-4">
          <Button
            variant="tertiary"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            leftIcon={<ChevronLeft size={16} />}
            className="min-h-9 px-3 text-body-sm"
          >
            Trước
          </Button>

          <div className="flex items-center gap-1 px-1">
            {pageNumbers.map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1 text-caption text-mute select-none">
                    ...
                  </span>
                );
              }
              const pageNum = p as number;
              const isActive = pageNum === page;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`h-9 min-w-9 rounded-md px-2 text-body-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-body hover:bg-canvas-soft hover:text-ink"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            variant="tertiary"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            rightIcon={<ChevronRight size={16} />}
            className="min-h-9 px-3 text-body-sm"
          >
            Sau
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

