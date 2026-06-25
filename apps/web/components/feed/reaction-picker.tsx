"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { POST_REACTIONS, PostReactionType, reactionMeta } from "../../lib/reactions";

type ReactionPickerProps = {
  activeReaction?: PostReactionType | null;
  disabled?: boolean;
  onReact: (type: PostReactionType) => void;
};

export function ReactionPicker({ activeReaction, disabled, onReact }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const [hoveredType, setHoveredType] = useState<PostReactionType | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = reactionMeta(activeReaction);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setHoveredType(null);
    }, 220);
  }, [clearCloseTimer]);

  const handleOpen = () => {
    if (disabled) return;
    clearCloseTimer();
    setOpen(true);
  };

  const handleSelect = (type: PostReactionType) => {
    clearCloseTimer();
    setOpen(false);
    setHoveredType(null);
    onReact(type);
  };

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  return (
    <div
      ref={rootRef}
      className="relative flex justify-center"
      onMouseEnter={handleOpen}
      onMouseLeave={scheduleClose}
      onFocus={handleOpen}
      onBlur={scheduleClose}
    >
      <AnimatePresence>
        {open && !disabled ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2"
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
          >
            <div className="flex items-end gap-1 rounded-full border border-hairline-strong bg-surface-card px-2 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
              {POST_REACTIONS.map((reaction, index) => {
                const isHovered = hoveredType === reaction.type;
                return (
                  <motion.button
                    key={reaction.type}
                    type="button"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                    whileHover={{ scale: 1.28, y: -6 }}
                    whileTap={{ scale: 1.1 }}
                    onMouseEnter={() => setHoveredType(reaction.type)}
                    onMouseLeave={() => setHoveredType(null)}
                    onClick={() => handleSelect(reaction.type)}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full text-ink shadow-md ring-2 transition ${reaction.bg} ${
                      isHovered ? reaction.ring : "ring-transparent"
                    }`}
                    aria-label={reaction.hoverLabel}
                    title={reaction.hoverLabel}
                  >
                    {reaction.icon}
                  </motion.button>
                );
              })}
            </div>
            {hoveredType ? (
              <p className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-surface-deep px-2 py-0.5 text-[11px] font-semibold text-ink shadow-md">
                {reactionMeta(hoveredType).hoverLabel}
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onReact(activeReaction ?? "LIKE")}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition disabled:cursor-default ${
          activeReaction
            ? "bg-surface-elevated"
            : "text-body hover:bg-surface-elevated hover:text-ink"
        }`}
        style={
          activeReaction
            ? {
                color:
                  activeReaction === "LIKE"
                    ? "var(--colors-accent-blue)"
                    : activeReaction === "CELEBRATE"
                      ? "var(--colors-accent-yellow)"
                      : activeReaction === "SUPPORT"
                        ? "var(--colors-accent-green)"
                        : "var(--colors-accent-orange)"
              }
            : undefined
        }
      >
        <span className="inline-flex shrink-0 items-center justify-center [&_svg]:stroke-current">
          {activeReaction ? active.icon : POST_REACTIONS[0].icon}
        </span>
        {activeReaction ? active.label : "Thích"}
      </button>
    </div>
  );
}
