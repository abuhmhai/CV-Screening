"use client";

import { Sparkles } from "lucide-react";
import { formatScore } from "../lib/format";
import { Loader } from "./ui/loader";

function scoreColor(score?: number) {
  if (!score) return "text-mute";
  if (score >= 80) return "text-positive-deep";
  if (score >= 60) return "text-warning-deep";
  return "text-negative-deep";
}

function scoreBg(score?: number) {
  if (!score) return "bg-canvas";
  if (score >= 80) return "bg-primary-pale";
  if (score >= 60) return "bg-warning/30";
  return "bg-negative-bg/10";
}

export function ApplicationAiScorePanel({
  loading,
  score,
  grade
}: {
  loading: boolean;
  score?: number;
  grade?: string | null;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-hairline-strong bg-surface-elevated px-4 py-4 sm:col-span-2">
        <div className="flex items-center gap-3">
          <Loader size={10} />
          <div>
            <p className="text-sm font-semibold text-ink">AI đang chấm hồ sơ...</p>
            <p className="mt-0.5 text-xs text-mute">Thường mất vài phút. Điểm sẽ hiện tự động khi xong.</p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
          <div className="h-full w-2/5 animate-pulse rounded-full bg-accent-blue-glow" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-xl px-4 py-3 ${scoreBg(score)} transition-colors`}>
        <p className="mb-1 flex items-center gap-1 text-caption font-semibold uppercase tracking-wider text-mute">
          <Sparkles size={12} /> AI Score
        </p>
        <div className="flex items-end gap-1">
          <p className={`text-2xl font-black tabular-nums leading-none ${scoreColor(score)}`}>
            {score != null ? formatScore(score) : "—"}
          </p>
          {score != null ? <span className="mb-0.5 text-caption font-bold text-mute">/100</span> : null}
        </div>
      </div>
      <div className="rounded-xl bg-canvas px-4 py-3">
        <p className="mb-1 text-caption font-semibold uppercase tracking-wider text-mute">Grade</p>
        <p className={`text-2xl font-black leading-none ${scoreColor(score)}`}>{grade ?? "—"}</p>
      </div>
    </>
  );
}
