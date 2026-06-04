import React from "react";
import { Spinner } from "./loader";

/** DESIGN.md: button-primary | button-secondary | button-tertiary | danger */
type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-on hover:bg-surface-light active:bg-surface-light/90 shadow-none",
  secondary: "bg-surface-card text-ink border border-hairline-strong hover:bg-surface-elevated",
  tertiary: "bg-canvas text-ink border border-hairline-strong hover:bg-surface-card",
  ghost: "bg-surface-elevated text-ink border border-hairline-strong hover:bg-surface-card",
  danger: "bg-negative text-white hover:bg-accent-red-glow active:bg-negative border border-hairline-strong"
};

export function Button({
  children,
  variant = "primary",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md px-4 py-2 text-button-md font-medium transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 ${variantStyles[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size={16} />}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
