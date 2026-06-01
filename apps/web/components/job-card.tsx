import Link from "next/link";
import { Job } from "../lib/types";
import { formatSalary } from "../lib/format";
import { Card } from "./ui/card";
import { Badge, StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar } from "./ui/avatar";
import { SkillTag } from "./ui/skill-tag";

export function JobCard({ job }: { job: Job }) {
  return (
    <Card hover variant="content" className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <Avatar initials={job.company?.name ?? "Co"} size="lg" className="shrink-0" />
          <div className="min-w-0">
            <Link
              href={`/jobs/${job.id}`}
              className="line-clamp-1 text-lg font-semibold text-ink transition hover:text-ink-deep hover:underline"
            >
              {job.title}
            </Link>
            <p className="mt-1 text-body-sm text-body">
              {job.company?.name} · {job.level} · {job.jobType} · {job.location ?? "Remote"}
            </p>
            <p className="mt-1.5 text-body-sm font-semibold text-ink-deep">
              {formatSalary(job.minSalary, job.maxSalary)}
            </p>
          </div>
        </div>
        {job.status === "ACTIVE" ? (
          <Badge variant="active">ACTIVE</Badge>
        ) : (
          <StatusBadge status={job.status} />
        )}
      </div>

      <div className="mt-auto">
        {job.requiredSkills && job.requiredSkills.length > 0 ? (
          <div className="mb-5 flex flex-wrap gap-2">
            {job.requiredSkills.slice(0, 5).map((skill) => (
              <SkillTag key={skill}>{skill}</SkillTag>
            ))}
            {job.requiredSkills.length > 5 ? (
              <SkillTag>+{job.requiredSkills.length - 5}</SkillTag>
            ) : null}
          </div>
        ) : (
          <div className="mb-5" />
        )}

        <div className="flex flex-col items-start justify-between gap-3 border-t border-ink/5 pt-4 sm:flex-row sm:items-center">
          <span className="text-caption font-medium text-mute">
            {job._count?.applications ?? 0} ứng viên · Hết hạn{" "}
            {job.expiresAt ? new Date(job.expiresAt).toLocaleDateString("vi-VN") : "—"}
          </span>
          <Link href={`/jobs/${job.id}`} className="w-full sm:w-auto">
            <Button variant="primary" className="w-full min-h-10 px-5 py-2 text-body-sm sm:w-auto">
              Xem & ứng tuyển
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
