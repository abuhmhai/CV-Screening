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
  active: "bg-surface-elevated text-positive border border-hairline-strong",
  screening: "bg-surface-elevated text-warning border border-hairline-strong",
  review: "bg-surface-elevated text-ink border border-hairline-strong",
  interview: "bg-surface-elevated text-link border border-hairline-strong",
  rejected: "bg-surface-elevated text-negative border border-hairline-strong",
  pending: "bg-surface-elevated text-warning border border-hairline-strong",
  accepted: "bg-surface-elevated text-positive border border-hairline-strong",
  default: "bg-surface-elevated text-body border border-hairline-strong"
};

const toneStyles: Record<Tone, string> = {
  default: "bg-surface-elevated text-body border border-hairline-strong",
  positive: "bg-surface-elevated text-positive border border-hairline-strong",
  warning: "bg-surface-elevated text-warning border border-hairline-strong",
  negative: "bg-surface-elevated text-negative border border-hairline-strong",
  primary: "bg-primary text-primary-on border border-hairline-strong"
};

export function Badge({ variant, tone, children, className = "", ...props }: BadgeProps) {
  const styleClass = variant
    ? variantStyles[variant]
    : tone
      ? toneStyles[tone]
      : variantStyles.default;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium leading-5 ${styleClass} ${className}`}
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
