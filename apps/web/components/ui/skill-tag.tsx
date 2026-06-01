import React from "react";

interface SkillTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function SkillTag({ children, className = "", ...props }: SkillTagProps) {
  return (
    <span
      className={`rounded-sm bg-canvas-soft px-3 py-1 text-body-sm font-semibold text-body transition-colors duration-150 hover:bg-primary-pale hover:text-ink-deep ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
