"use client";

import { motion } from "framer-motion";
import { ExternalJob } from "../../lib/types";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/states";
import { ExternalJobCard } from "./job-card";

export function JobList({
  jobs,
  loading,
  page,
  totalPages,
  onPageChange,
  onScreen
}: {
  jobs: ExternalJob[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  onScreen: (job: ExternalJob) => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-56 w-full" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="Chưa có việc làm tổng hợp"
        description="Thử đổi bộ lọc, hoặc nhờ quản trị viên chạy crawl để tải dữ liệu mới."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 stagger-children">
        {jobs.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: (i % 6) * 0.08 }}
          >
            <ExternalJobCard job={job} onScreen={onScreen} />
          </motion.div>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="tertiary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Trước
          </Button>
          <span className="text-body-sm text-body">
            Trang {page}/{totalPages}
          </span>
          <Button variant="tertiary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Sau
          </Button>
        </div>
      ) : null}
    </div>
  );
}
