"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FolderSearch, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { Loader } from "./loader";

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
    <div className="rounded-lg border border-dashed border-hairline-strong bg-canvas p-8 text-center sm:p-10">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated text-lg text-body border border-hairline-strong">
        {icon ?? <FolderSearch size={28} strokeWidth={1.5} className="text-body" />}
      </div>
      <h3 className="text-heading-md font-medium text-ink">{title}</h3>
      {description ? <p className="mt-2 text-body-sm text-mute">{description}</p> : null}
      {actionLabel && actionHref ? (
        <div className="mt-6">
          <Link href={actionHref}>
            <Button variant="ghost">{actionLabel}</Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function LoadingBlock({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-canvas p-10 text-body sm:p-12 border border-hairline-strong"
      role="status"
      aria-live="polite"
    >
      <Loader label={label} />
    </div>
  );
}

/** Single shimmering placeholder bar. Compose into richer skeletons. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/**
 * Card-shaped loading placeholder that mirrors a typical content card so the
 * layout doesn't jump when real data arrives.
 */
export function SkeletonCard({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`rounded-lg bg-surface-card p-6 shadow-none border border-hairline-strong ${className}`} role="status" aria-live="polite">
      <Skeleton className="h-5 w-2/5" />
      <Skeleton className="mt-3 h-3 w-3/5" />
      <div className="mt-5 space-y-2.5">
        {Array.from({ length: lines }).map((_, idx) => (
          <Skeleton key={idx} className={`h-3 ${idx % 2 === 0 ? "w-full" : "w-4/5"}`} />
        ))}
      </div>
      <span className="sr-only">Đang tải nội dung</span>
    </div>
  );
}

/** Grid of skeleton cards for list/loading screens. */
export function SkeletonList({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg bg-surface-card border border-negative p-6 text-ink" role="alert">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle size={20} className="text-negative" />
        <p className="font-medium">Có lỗi xảy ra</p>
      </div>
      <p className="text-body-sm text-body">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-surface-elevated border border-hairline-strong px-4 py-2 text-body-sm font-medium text-ink transition hover:bg-surface-card"
        >
          Thử lại
        </button>
      ) : null}
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
        <span className="font-medium text-ink tabular-nums">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-deep border border-hairline-strong" aria-hidden="true">
        <motion.div
          initial={prefersReducedMotion ? undefined : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={`h-full rounded-full ${barClass}`}
        />
      </div>
    </div>
  );
}
