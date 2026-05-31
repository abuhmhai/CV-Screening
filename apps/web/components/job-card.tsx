import Link from "next/link";
import { Job } from "../lib/types";
import { formatSalary } from "../lib/format";
import { Card } from "./ui/card";
import { StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";

export function JobCard({ job }: { job: Job }) {
  return (
    <Card className="group">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-pale text-lg font-black text-ink-deep">
            {(job.company?.name ?? "Co").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <Link href={`/jobs/${job.id}`} className="text-xl font-semibold text-ink transition hover:text-ink-deep hover:underline">
              {job.title}
            </Link>
            <p className="mt-1 text-sm text-body">
              {job.company?.name} · {job.level} · {job.jobType} · {job.location ?? "Remote"}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink-deep">
              {formatSalary(job.minSalary, job.maxSalary)}
            </p>
          </div>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {job.requiredSkills && job.requiredSkills.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.requiredSkills.slice(0, 5).map((skill) => (
            <span key={skill} className="rounded-pill bg-canvas-soft px-3 py-1 text-xs font-semibold text-body">
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-ink/5 pt-4 sm:flex-row sm:items-center">
        <span className="text-xs text-mute">
          {job._count?.applications ?? 0} ứng viên · Hết hạn {job.expiresAt ? new Date(job.expiresAt).toLocaleDateString("vi-VN") : "—"}
        </span>
        <Link href={`/jobs/${job.id}`} className="w-full sm:w-auto">
          <Button className="px-5 py-2 text-sm">Xem & ứng tuyển</Button>
        </Link>
      </div>
    </Card>
  );
}
