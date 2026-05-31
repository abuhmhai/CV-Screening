import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="mt-1 w-full rounded-md border border-ink/20 bg-canvas px-4 py-3 text-body-md outline-none transition focus:border-ink"
      {...props}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="mt-1 w-full rounded-md border border-ink/20 bg-canvas px-4 py-3 text-body-md outline-none transition focus:border-ink"
      {...props}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="mt-1 w-full rounded-md border border-ink/20 bg-canvas px-4 py-3 text-body-md outline-none transition focus:border-ink"
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
