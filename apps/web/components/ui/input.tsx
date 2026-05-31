import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const controlClass =
  "mt-1 w-full rounded-md border border-ink/20 bg-canvas px-4 py-3 text-body-md text-ink shadow-[inset_0_0_0_1px_rgba(14,15,12,0.02)] outline-none transition placeholder:text-mute hover:border-ink/40 focus:border-ink focus:ring-2 focus:ring-primary/70 disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-mute";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`${controlClass} ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${controlClass} min-h-24 resize-y ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`${controlClass} ${className}`}
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
    <label className="block text-sm font-semibold text-ink">
      {label}
      {children}
    </label>
  );
}
