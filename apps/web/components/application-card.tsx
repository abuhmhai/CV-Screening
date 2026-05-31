"use client";

import Link from "next/link";
import { Application } from "../lib/types";
import { formatDate, formatScore } from "../lib/format";
import { Card } from "./ui/card";
import { StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";

export function ApplicationCard({ application }: { application: Application }) {
  const score = application.aiResult?.overallScore;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">{application.job?.title ?? "Ứng tuyển"}</h2>
          <p className="mt-1 text-sm text-body">
            {application.job?.company?.name} · Nộp {formatDate(application.appliedAt)}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-canvas-soft px-4 py-3">
          <p className="text-xs text-mute">AI Score</p>
          <p className="text-xl font-black text-ink">{score ? formatScore(score) : "—"}</p>
        </div>
        <div className="rounded-lg bg-canvas-soft px-4 py-3">
          <p className="text-xs text-mute">Grade</p>
          <p className="text-xl font-black text-ink">{application.aiResult?.grade ?? "—"}</p>
        </div>
        <div className="rounded-lg bg-canvas-soft px-4 py-3">
          <p className="text-xs text-mute">Vị trí</p>
          <p className="text-sm font-semibold text-ink">{application.job?.location ?? "Remote"}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link href={`/applications/${application.id}`} className="w-full sm:w-auto">
          <Button variant="secondary" className="px-4 py-2 text-sm">
            Chi tiết
          </Button>
        </Link>
        {application.aiResult ? (
          <Link href={`/ai-score/${application.id}`} className="w-full sm:w-auto">
            <Button className="px-4 py-2 text-sm">Xem AI Score</Button>
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
