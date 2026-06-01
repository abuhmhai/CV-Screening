import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/** DESIGN.md: text-input */
const controlClass =
  "mt-1.5 w-full rounded-md border border-ink bg-canvas px-4 py-3 text-body-md text-ink shadow-[inset_0_0_0_1px_rgba(14,15,12,0.02)] outline-none transition placeholder:text-mute hover:border-ink/80 focus:border-ink focus:ring-2 focus:ring-primary/70 disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-mute";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClass} ${className}`} {...props} />;
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${controlClass} min-h-24 resize-y ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`${controlClass} appearance-none ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%230e0f0c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
        backgroundPosition: "right 0.75rem center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "1.25em 1.25em",
        paddingRight: "2.5rem"
      }}
      {...props}
    />
  );
}

export function FieldLabel({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-body-sm font-semibold text-ink">
      {label}
      {children}
    </label>
  );
}
