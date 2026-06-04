import React from "react";

/** DESIGN.md: card-content | card-feature-sage | card-feature-green | card-feature-dark | converter */
export type CardVariant = "content" | "sage" | "green" | "dark" | "converter";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: CardVariant;
  hover?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  content: "bg-surface-card text-ink border border-hairline-strong",
  sage: "bg-surface-elevated text-ink border border-hairline-strong",
  green: "bg-accent-green-glow text-ink border border-hairline-strong",
  dark: "bg-surface-deep text-body border border-hairline-strong",
  converter: "bg-canvas text-ink border border-hairline-strong"
};

export function Card({
  children,
  className = "",
  variant = "content",
  hover = false,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-lg p-6 shadow-none ${variantStyles[variant]} ${
        hover
          ? "cursor-pointer transition-all duration-250 hover:-translate-y-1 hover:border-hairline"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <Card className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
      <div className="min-w-0">
        <h1 className="font-display text-display-sm font-black leading-tight text-ink sm:text-display-md">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-body-md text-body">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div>
      ) : null}
    </Card>
  );
}
