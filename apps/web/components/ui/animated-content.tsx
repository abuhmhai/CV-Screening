"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * AnimatedContent — React Bits (https://reactbits.dev/) wrapper that fades and
 * slides its children into view, with an optional stagger delay.
 */
export function AnimatedContent({
  children,
  delay = 0,
  distance = 28,
  direction = "vertical",
  className = ""
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  direction?: "vertical" | "horizontal";
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const axis = direction === "horizontal" ? "x" : "y";

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, [axis]: distance }}
      whileInView={{ opacity: 1, [axis]: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
