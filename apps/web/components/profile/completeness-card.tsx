"use client";

import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Card } from "../ui/card";
import { OnboardingChecklist } from "../../lib/types";

const ITEM_LABELS: Record<string, string> = {
  full_name: "Thêm họ và tên",
  headline: "Thêm chức danh chuyên môn",
  about: "Thêm phần giới thiệu bản thân",
  avatar: "Tải lên ảnh đại diện",
  experience: "Thêm ít nhất 1 kinh nghiệm làm việc",
  education: "Thêm ít nhất 1 học vấn",
  skills: "Thêm ít nhất 3 kỹ năng",
  projects: "Thêm dự án nổi bật",
  certifications: "Thêm chứng chỉ",
  languages: "Thêm ngôn ngữ",
  links: "Thêm liên kết mạng xã hội hoặc portfolio",
  cv: "Tải lên CV của bạn",
};

/** Progress + actionable checklist of what's still missing from the profile. */
export function CompletenessCard({
  checklist,
  onItemClick
}: {
  checklist: OnboardingChecklist | null;
  onItemClick?: (itemKey: string) => void;
}) {
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
        <div className={`h-full rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-body-sm text-mute">
        {remaining.length === 0
          ? "Tuyệt vời! Hồ sơ của bạn đã đầy đủ."
          : `Hoàn thành thêm ${remaining.length} mục để tăng khả năng hiển thị với nhà tuyển dụng.`}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {checklist.items.map((item) => {
          const label = ITEM_LABELS[item.key] || item.label;
          if (item.done) {
            return (
              <li key={item.key} className="flex items-center gap-2 px-2 py-1.5 text-body-sm">
                <CheckCircle2 size={16} className="shrink-0 text-positive" />
                <span className="text-mute line-through">{label}</span>
              </li>
            );
          }
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onItemClick?.(item.key)}
                className="group flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-body-sm text-ink transition-all hover:border-hairline hover:bg-canvas-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title={`Đi tới phần: ${label}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Circle size={16} className="shrink-0 text-mute transition-colors group-hover:text-primary" />
                  <span className="truncate font-medium text-body transition-colors group-hover:text-primary">
                    {label}
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center text-xs text-mute transition-all group-hover:translate-x-0.5 group-hover:text-primary">
                  <ArrowRight size={14} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

