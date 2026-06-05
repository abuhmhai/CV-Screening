"use client";

import Link from "next/link";
import { Sparkles, Target, TrendingUp, Lightbulb } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ProfileInsights } from "../../lib/types";

function Gauge({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  let color = "text-positive";
  if (value < 50) color = "text-negative";
  else if (value < 75) color = "text-warning";
  return (
    <div className="rounded-lg border border-hairline-strong bg-canvas-soft p-4">
      <div className="flex items-center gap-2 text-body-sm text-mute">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`mt-1 text-2xl font-black tabular-nums ${color}`}>{value}%</p>
    </div>
  );
}

/** AI-flavoured readiness + skill-gap analysis. */
export function InsightsCard({ insights }: { insights: ProfileInsights | null }) {
  if (!insights) return null;

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-primary" />
        <h2 className="text-lg font-semibold text-ink">AI Insights</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Gauge label="Sẵn sàng ứng tuyển" value={insights.readiness} icon={<TrendingUp size={14} />} />
        <Gauge label="Độ phủ kỹ năng" value={insights.skillCoverage} icon={<Target size={14} />} />
        <Gauge label="Hoàn thiện hồ sơ" value={insights.completeness} icon={<Sparkles size={14} />} />
      </div>

      {insights.missingSkills.length > 0 ? (
        <div>
          <h3 className="text-body-sm font-semibold text-ink">Kỹ năng nên bổ sung (đang được tuyển nhiều)</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {insights.missingSkills.map((m) => (
              <Badge key={m.skill} tone="warning">
                {m.skill} · {m.demand}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {insights.recommendedJobs.length > 0 ? (
        <div>
          <h3 className="text-body-sm font-semibold text-ink">Việc làm gợi ý cho bạn</h3>
          <ul className="mt-2 space-y-2">
            {insights.recommendedJobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-hairline-strong bg-surface-card px-4 py-2.5 transition hover:border-hairline"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{job.title}</span>
                    <span className="block truncate text-body-sm text-mute">
                      {job.company ?? "—"} {job.location ? `· ${job.location}` : ""}
                    </span>
                  </span>
                  <Badge tone="primary">{job.matchedSkillCount} khớp</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {insights.tips.length > 0 ? (
        <div className="rounded-lg border border-hairline-strong bg-primary-pale/50 p-4">
          <div className="flex items-center gap-2 text-body-sm font-semibold text-ink">
            <Lightbulb size={14} /> Gợi ý cải thiện
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-body-sm text-body">
            {insights.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
