"use client";

import { Bookmark } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { useSavedJobs } from "../lib/saved-jobs-context";

export function SaveJobButton({
  jobId,
  variant = "icon"
}: {
  jobId: string;
  variant?: "icon" | "full";
}) {
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedJobs();

  if (!user) return null;

  const saved = isSaved(jobId);

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => void toggleSave(jobId)}
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-body-sm font-semibold transition ${
          saved
            ? "border-positive-deep bg-primary-pale text-positive-deep"
            : "border-ink/15 text-ink hover:bg-canvas-soft"
        }`}
        aria-pressed={saved}
      >
        <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
        {saved ? "Đã lưu" : "Lưu tin"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggleSave(jobId);
      }}
      className={`rounded-full p-2 transition ${
        saved ? "text-positive-deep" : "text-mute hover:bg-canvas-soft hover:text-ink"
      }`}
      aria-label={saved ? "Bỏ lưu việc làm" : "Lưu việc làm"}
      aria-pressed={saved}
      title={saved ? "Bỏ lưu" : "Lưu tin"}
    >
      <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
