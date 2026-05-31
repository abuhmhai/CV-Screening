"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function Card({
  children,
  className = "",
  padding = "p-6"
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl bg-canvas ${padding} shadow-[0_1px_0_rgba(14,15,12,0.04)] transition hover:shadow-sm ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-start justify-between gap-4 sm:flex-row">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-black leading-tight text-ink sm:text-display-sm">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-body-md text-body">{description}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div> : null}
    </Card>
  );
}
