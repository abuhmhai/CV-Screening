"use client";

import {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  isValidElement,
  Children
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

/** DESIGN.md: text-input */
const controlClass =
  "mt-1.5 w-full rounded-md border border-hairline-strong bg-surface-card px-4 py-3 text-body-md text-ink outline-none transition placeholder:text-mute hover:border-hairline focus:border-ink focus:ring-1 focus:ring-ink disabled:cursor-not-allowed disabled:bg-surface-elevated disabled:text-stone";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClass} ${className}`} {...props} />;
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${controlClass} min-h-24 resize-y ${className}`} {...props} />;
}

interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

/**
 * Custom animated dropdown (React Bits-inspired, https://reactbits.dev/) used as
 * a drop-in replacement for the native <select>. It accepts the same
 * `value` / `onChange` / `<option>` children API: `onChange` receives a
 * minimal synthetic event so existing `(e) => e.target.value` handlers work.
 */
export function Select({
  className = "",
  children,
  value,
  onChange,
  disabled,
  required,
  name
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const options = useMemo<SelectOption[]>(() => {
    const result: SelectOption[] = [];
    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.type === "option") {
        const props = child.props as {
          value?: string | number;
          children?: ReactNode;
          disabled?: boolean;
        };
        result.push({
          value: String(props.value ?? ""),
          label: props.children ?? String(props.value ?? ""),
          disabled: props.disabled
        });
      }
    });
    return result;
  }, [children]);

  const currentValue = value != null ? String(value) : "";
  const selected = options.find((opt) => opt.value === currentValue);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function emitChange(next: string) {
    onChange?.({ target: { value: next, name } } as unknown as React.ChangeEvent<HTMLSelectElement>);
  }

  function selectOption(opt: SelectOption) {
    if (opt.disabled) return;
    emitChange(opt.value);
    setOpen(false);
  }

  // Split caller className: width/margin tokens style the positioned wrapper,
  // the rest (padding, font-size, etc.) styles the trigger button.
  const tokens = className.split(/\s+/).filter(Boolean);
  const wrapperTokens = tokens.filter((t) => /^!?(w-|mt-|mb-|my-)/.test(t));
  const buttonTokens = tokens.filter((t) => !/^!?(w-|mt-|mb-|my-)/.test(t));
  const hasMargin = wrapperTokens.some((t) => /^!?(mt-|my-)/.test(t));
  const wrapperClass = `${hasMargin ? "" : "mt-1.5"} ${wrapperTokens.join(" ")}`.trim();
  const buttonClass = buttonTokens.join(" ");

  return (
    <div ref={rootRef} className={`relative ${wrapperClass}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-md border border-hairline-strong bg-surface-card px-4 py-3 text-left text-body-md text-ink outline-none transition hover:border-hairline focus-visible:border-ink focus-visible:ring-1 focus-visible:ring-ink disabled:cursor-not-allowed disabled:bg-surface-elevated disabled:text-stone ${buttonClass}`}
      >
        <span className={`truncate ${selected ? "text-ink" : "text-mute"}`}>
          {selected?.label ?? options[0]?.label ?? "Chọn..."}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-mute">
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-auto rounded-lg border border-hairline-strong bg-surface-card p-1.5 shadow-none"
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === currentValue;
              return (
                <motion.li
                  key={`${opt.value}-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.025, duration: 0.15 }}
                  onClick={() => selectOption(opt)}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-body-sm transition-colors ${
                    opt.disabled
                      ? "cursor-not-allowed text-stone opacity-60"
                      : isSelected
                        ? "bg-surface-elevated font-medium text-ink"
                        : "text-body hover:bg-surface-elevated hover:text-ink"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected ? <Check size={16} className="shrink-0 text-primary" /> : null}
                </motion.li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
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
