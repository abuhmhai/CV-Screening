import React from "react";

export type BadgeVariant =
  | "active"
  | "screening"
  | "review"
  | "interview"
  | "rejected"
  | "pending"
  | "accepted"
  | "default";

export type Tone = "default" | "positive" | "warning" | "negative" | "primary";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  tone?: Tone;
  children: React.ReactNode;
}

/** Semantic status — DESIGN.md badge-positive / badge-negative patterns */
const variantStyles: Record<BadgeVariant, string> = {
  active: "bg-primary-pale text-positive-deep",
  screening: "bg-warning text-warning-content",
  review: "bg-canvas-soft text-ink",
  interview: "bg-primary-neutral text-ink-deep",
  rejected: "bg-negative-bg text-white",
  pending: "bg-warning text-warning-content",
  accepted: "bg-primary-pale text-positive-deep",
  default: "bg-canvas-soft text-body"
};

const toneStyles: Record<Tone, string> = {
  default: "bg-canvas-soft text-body",
  positive: "bg-primary-pale text-positive-deep",
  warning: "bg-warning text-warning-content",
  negative: "bg-negative-bg text-white",
  primary: "bg-primary text-on-primary"
};

export function Badge({ variant, tone, children, className = "", ...props }: BadgeProps) {
  const styleClass = variant
    ? variantStyles[variant]
    : tone
      ? toneStyles[tone]
      : variantStyles.default;

  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1 text-body-sm font-semibold leading-5 ${styleClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  let variant: BadgeVariant = "default";

  if (status.includes("REJECT") || status.includes("WITHDRAW")) variant = "rejected";
  else if (status.includes("OFFER")) variant = "accepted";
  else if (status.includes("INTERVIEW")) variant = "interview";
  else if (status.includes("HR")) variant = "review";
  else if (status.includes("AI")) variant = "screening";
  else if (status === "ACTIVE") variant = "active";
  else if (status === "APPLIED") variant = "pending";

  return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
}
