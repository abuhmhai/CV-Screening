"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * React Bits-inspired loading motions (https://reactbits.dev/).
 * Built with framer-motion. Three pieces:
 * - Spinner: small currentColor ring, ideal inside buttons/inline.
 * - Loader: animated dot-wave with optional label, for section/page loading.
 * - LoaderOverlay: full-screen blocking overlay for in-flight actions.
 */

export function Spinner({
  size = 16,
  className = ""
}: {
  size?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.span
      className={`inline-block rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Đang tải"
      animate={prefersReducedMotion ? undefined : { rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
    />
  );
}

export function Loader({
  label,
  size = 12,
  className = ""
}: {
  label?: string;
  size?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const dots = [0, 1, 2];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status" aria-live="polite">
      <div className="flex items-end gap-1.5">
        {dots.map((i) => (
          <motion.span
            key={i}
            className="rounded-full bg-primary"
            style={{ width: size, height: size }}
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, -size * 0.9, 0], opacity: [0.5, 1, 0.5] }
            }
            transition={{
              repeat: Infinity,
              duration: 0.9,
              ease: "easeInOut",
              delay: i * 0.15
            }}
          />
        ))}
      </div>
      {label ? <span className="text-body-sm text-body">{label}</span> : null}
    </div>
  );
}

export function LoaderOverlay({
  show,
  label = "Đang xử lý..."
}: {
  show: boolean;
  label?: string;
}) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm"
          role="status"
          aria-live="assertive"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-white/20 bg-canvas/95 px-10 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          >
            <Loader label={label} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
