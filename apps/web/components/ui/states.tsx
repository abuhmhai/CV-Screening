"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FolderSearch, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "./button";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-ink/15 bg-canvas p-8 text-center sm:p-10">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-pale text-lg font-black text-ink-deep">
        {icon ?? <FolderSearch size={28} strokeWidth={1.5} className="text-ink" />}
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-2 text-body-sm text-body">{description}</p> : null}
      {actionLabel && actionHref ? (
        <div className="mt-6">
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function LoadingBlock({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-canvas p-10 text-body sm:p-12"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-ink" />
        <span className="text-body-md">{label}</span>
      </div>
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-negative-bg p-6 text-white" role="alert">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle size={20} />
        <p className="font-semibold">Có lỗi xảy ra</p>
      </div>
      <p className="text-body-sm text-white/80">{message}</p>
    </div>
  );
}

export function ScoreBar({
  label,
  value,
  max = 100
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const prefersReducedMotion = useReducedMotion();

  let barClass = "bg-primary";
  if (pct < 50) barClass = "bg-negative";
  else if (pct < 75) barClass = "bg-warning";

  return (
    <div>
      <div className="mb-1 flex justify-between text-body-sm">
        {label ? <span className="text-body">{label}</span> : <span className="sr-only">Score</span>}
        <span className="font-semibold text-ink tabular-nums">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-pill bg-canvas-soft" aria-hidden="true">
        <motion.div
          initial={prefersReducedMotion ? undefined : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={`h-full rounded-pill ${barClass}`}
        />
      </div>
    </div>
  );
}
