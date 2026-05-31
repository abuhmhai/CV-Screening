"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface ScoreSlice {
  label: string;
  value: number;
  hint: string;
}

interface AiScoreDetailClientProps {
  scoreBreakdown: ScoreSlice[];
}

const matchedSkills = ["Python", "FastAPI", "PostgreSQL", "Docker"];
const missingSkills = ["Kubernetes", "AWS"];
const scoreReasons = [
  "Kinh nghiệm backend sát JD, thể hiện được ownership trong dự án production.",
  "Kỹ năng cốt lõi đạt mức tốt, nhưng còn thiếu năng lực cloud-native để scale team.",
  "Portfolio rõ ràng và có kết quả đo lường, giúp AI đánh giá tính thực chiến cao."
];

export function AiScoreDetailClient({ scoreBreakdown }: AiScoreDetailClientProps) {
  const [isReviewConfirmed, setIsReviewConfirmed] = useState(false);
  const overallScore = 82.5;
  const grade = "B+";

  const recommendation = useMemo(
    () => (overallScore >= 80 ? "Recommend for interview" : "Need manual review"),
    [overallScore]
  );

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-xl bg-canvas p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">Overall Result</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-pill bg-primary px-4 py-1 text-sm font-semibold text-ink">{overallScore} / 100</span>
              <span className="rounded-pill bg-canvas-soft px-3 py-1 text-sm font-semibold text-ink">{grade} Grade</span>
            </div>
          </div>

          <p className="mt-3 rounded-lg bg-primary-pale px-4 py-3 text-sm text-ink-deep">
            Recommendation: <strong>{recommendation}</strong>
          </p>

          <div className="mt-6 space-y-4">
            {scoreBreakdown.map((item) => (
              <div key={item.label} className="rounded-lg bg-canvas-soft px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{item.label}</span>
                  <span className="font-semibold text-ink">{item.value}</span>
                </div>
                <div className="mt-2 h-3 rounded-pill bg-canvas">
                  <div className="h-full rounded-pill bg-primary transition-all" style={{ width: `${item.value}%` }} />
                </div>
                <p className="mt-2 text-xs text-body">{item.hint}</p>
              </div>
            ))}
          </div>

          <article className="mt-6 rounded-xl bg-canvas-soft p-4">
            <h3 className="text-sm font-semibold text-ink">Why this score</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-body">
              {scoreReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </article>
        </article>

        <aside className="space-y-4">
          <article className="rounded-xl bg-canvas p-6">
            <h3 className="text-base font-semibold text-ink">Matched Skills</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {matchedSkills.map((skill) => (
                <span key={skill} className="rounded-pill bg-primary-pale px-3 py-1 text-xs font-semibold text-ink-deep">
                  {skill}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-xl bg-canvas p-6">
            <h3 className="text-base font-semibold text-ink">Missing Skills</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {missingSkills.map((skill) => (
                <span key={skill} className="rounded-pill bg-warning/40 px-3 py-1 text-xs font-semibold text-warning-content">
                  {skill}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-xl bg-canvas p-6">
            <h3 className="text-base font-semibold text-ink">Review Gate</h3>
            <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg bg-canvas-soft px-3 py-2 text-sm text-body">
              <input
                type="checkbox"
                checked={isReviewConfirmed}
                onChange={(event) => setIsReviewConfirmed(event.target.checked)}
                className="h-4 w-4 accent-[var(--colors-primary)]"
              />
              I reviewed the score rationale and skill gap.
            </label>
          </article>
        </aside>
      </section>

      <footer className="flex flex-wrap gap-3">
        <Link
          href="/applications"
          className="rounded-xl border border-ink px-5 py-2 text-sm font-semibold text-ink transition hover:bg-canvas"
        >
          Back to Applications
        </Link>
        <button
          disabled={!isReviewConfirmed}
          className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-ink transition hover:bg-primary-active disabled:cursor-not-allowed disabled:bg-primary-neutral"
        >
          Move to Interview
        </button>
      </footer>
    </>
  );
}
