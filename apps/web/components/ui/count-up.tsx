"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

/**
 * CountUp — React Bits (https://reactbits.dev/) animated number that counts
 * from `from` to `to` when it scrolls into view.
 */
export function CountUp({
  to,
  from = 0,
  duration = 1.6,
  decimals = 0,
  suffix = "",
  className = ""
}: {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(from);
  const spring = useSpring(motionValue, {
    damping: 30,
    stiffness: 110,
    duration: duration * 1000
  });
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (inView) motionValue.set(to);
  }, [inView, to, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = latest.toFixed(decimals) + suffix;
      }
    });
    return unsubscribe;
  }, [spring, decimals, suffix]);

  return (
    <span ref={ref} className={className}>
      {from.toFixed(decimals)}
      {suffix}
    </span>
  );
}
