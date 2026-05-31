import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "rounded-xl bg-primary px-6 py-3 text-button-md text-ink"
      : "rounded-xl bg-canvas-soft px-6 py-3 text-button-md text-ink";

  return <button className={`${variantClass} ${className}`.trim()} {...props} />;
}
