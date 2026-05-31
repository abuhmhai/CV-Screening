"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "./button";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-ink/15 bg-canvas p-10 text-center">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-2 text-sm text-body">{description}</p> : null}
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
    <div className="flex items-center justify-center rounded-xl bg-canvas p-12 text-body">
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
        {label}
      </div>
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-negative/10 p-6 text-negative">
      <p className="font-semibold">Có lỗi xảy ra</p>
      <p className="mt-1 text-sm">{message}</p>
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
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-body">{label}</span>
        <span className="font-semibold text-ink">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-pill bg-canvas-soft">
        <motion.div
          initial={prefersReducedMotion ? undefined : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="h-full rounded-pill bg-primary transition-all"
        />
      </div>
    </div>
  );
}
