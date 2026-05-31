"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-ink hover:bg-primary-active active:bg-primary-neutral",
  secondary: "bg-canvas-soft text-ink hover:bg-primary-pale active:bg-primary-neutral",
  tertiary: "border border-ink bg-canvas text-ink hover:bg-canvas-soft active:bg-primary-pale",
  danger: "bg-negative text-white hover:bg-negative-deep active:bg-negative-darkest"
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-button-md font-semibold transition duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
