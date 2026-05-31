import { ReactNode } from "react";

type Tone = "default" | "positive" | "warning" | "negative" | "primary";

const tones: Record<Tone, string> = {
  default: "bg-canvas-soft text-ink",
  positive: "bg-primary-pale text-ink-deep",
  warning: "bg-warning/30 text-warning-content",
  negative: "bg-negative/10 text-negative",
  primary: "bg-primary text-ink"
};

export function Badge({
  children,
  tone = "default",
  className = ""
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-pill px-3 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Tone =
    status.includes("REJECT") || status.includes("WITHDRAW")
      ? "negative"
      : status.includes("OFFER") || status.includes("INTERVIEW")
        ? "positive"
        : status.includes("AI") || status.includes("HR")
          ? "warning"
          : status === "ACTIVE"
            ? "positive"
            : "default";

  return <Badge tone={tone}>{status.replace(/_/g, " ")}</Badge>;
}
