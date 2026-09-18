"use client";

import Link from "next/link";
import { Briefcase, Bookmark, Send } from "lucide-react";
import { Card } from "../ui/card";
import { StatusBadge } from "../ui/badge";
import { formatDate } from "../../lib/format";
import { ProfileDashboard } from "../../lib/types";

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline-strong bg-canvas-soft p-4">
      <div className="flex items-center gap-2 text-body-sm text-mute">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-2xl font-black tabular-nums text-ink">{value}</p>
    </div>
  );
}

/** Activity stats: applications by status, saved jobs, recent applications. */
export function DashboardCard({ dashboard }: { dashboard: ProfileDashboard | null }) {
  if (!dashboard) return null;
  const statuses = Object.entries(dashboard.applicationsByStatus);

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-2">
        <Briefcase size={18} className="text-primary" />
        <h2 className="text-lg font-semibold text-ink">Hoạt động của bạn</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Đơn ứng tuyển" value={dashboard.totalApplications} icon={<Send size={14} />} />
        <Link href="/external-jobs?savedOnly=true" className="block rounded-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" title="Xem danh sách việc làm đã lưu">
          <Stat label="Việc đã lưu" value={dashboard.savedJobs} icon={<Bookmark size={14} />} />
        </Link>
      </div>

      {statuses.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {statuses.map(([status, count]) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <StatusBadge status={status} />
              <span className="text-body-sm font-semibold tabular-nums text-ink">{count}</span>
            </span>
          ))}
        </div>
      ) : null}

      {dashboard.recentApplications.length > 0 ? (
        <div>
          <h3 className="text-body-sm font-semibold text-ink">Ứng tuyển gần đây</h3>
          <ul className="mt-2 space-y-2">
            {dashboard.recentApplications.map((app) => (
              <li
                key={app.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-hairline-strong bg-surface-card px-4 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{app.jobTitle}</span>
                  <span className="block truncate text-body-sm text-mute">
                    {app.company ?? "—"} · {formatDate(app.appliedAt)}
                  </span>
                </span>
                <StatusBadge status={app.status} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-body-sm text-mute">
          Chưa có hoạt động. <Link href="/jobs" className="font-semibold text-primary hover:underline">Khám phá việc làm</Link>
        </p>
      )}
    </Card>
  );
}
