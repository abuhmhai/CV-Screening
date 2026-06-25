"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "../ui/card";
import { OnboardingChecklist } from "../../lib/types";

/** Progress + actionable checklist of what's still missing from the profile. */
export function CompletenessCard({ checklist }: { checklist: OnboardingChecklist | null }) {
  if (!checklist) return null;
  const pct = checklist.completion;
  const remaining = checklist.items.filter((i) => !i.done);

  let barClass = "bg-primary";
  if (pct < 50) barClass = "bg-negative";
  else if (pct < 80) barClass = "bg-warning";

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Mức độ hoàn thiện hồ sơ</h2>
        <span className="text-2xl font-black tabular-nums text-ink">{pct}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-deep border border-hairline-strong" aria-hidden="true">
        <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-body-sm text-mute">
        {remaining.length === 0
          ? "Tuyệt vời! Hồ sơ của bạn đã đầy đủ."
          : `Hoàn thành thêm ${remaining.length} mục để tăng khả năng hiển thị với nhà tuyển dụng.`}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {checklist.items.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-body-sm">
            {item.done ? (
              <CheckCircle2 size={16} className="shrink-0 text-positive" />
            ) : (
              <Circle size={16} className="shrink-0 text-mute" />
            )}
            <span className={item.done ? "text-mute line-through" : "text-body"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
