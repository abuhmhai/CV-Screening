import React from "react";
import { Loader2 } from "lucide-react";

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
  primary:
    "bg-primary text-on-primary hover:bg-primary-active active:bg-primary-neutral",
  secondary: "bg-canvas-soft text-ink hover:bg-primary-pale",
  tertiary:
    "bg-canvas text-ink border border-ink hover:bg-canvas-soft",
  ghost: "bg-transparent text-ink hover:bg-canvas-soft",
  danger: "bg-negative text-white hover:bg-negative-deep active:bg-negative-darkest"
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
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-button-md font-semibold transition-all duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 ${variantStyles[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
