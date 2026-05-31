"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-ink hover:bg-primary-active",
  secondary: "bg-canvas-soft text-ink hover:bg-primary-pale",
  tertiary: "border border-ink bg-canvas text-ink hover:bg-canvas-soft",
  danger: "bg-negative text-white hover:bg-negative-deep"
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
      className={`inline-flex items-center justify-center rounded-xl px-6 py-3 text-button-md font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
