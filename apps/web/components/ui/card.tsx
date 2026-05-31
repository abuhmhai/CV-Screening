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
      className={`rounded-xl bg-canvas ${padding} transition hover:shadow-sm ${className}`}
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
    <Card className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-display-sm font-black text-ink">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-body-md text-body">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </Card>
  );
}
