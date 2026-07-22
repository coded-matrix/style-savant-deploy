"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface NumberFlipProps {
  value: number | string;
  className?: string;
  duration?: number;
}

export function NumberFlip({ value, className, duration = 0.3 }: NumberFlipProps) {
  const reduce = useReducedMotion();
  const str = String(value);
  if (reduce) {
    return <span className={className}>{str}</span>;
  }
  return (
    <span className={`inline-flex overflow-hidden ${className ?? ""}`}>
      {str.split("").map((ch, i) => (
        <span key={i} className="relative inline-block overflow-hidden" style={{ height: "1em" }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={ch + i}
              className="inline-block tabular-nums"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "-100%" }}
              transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
            >
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
