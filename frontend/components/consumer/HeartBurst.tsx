"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface HeartBurstProps {
  show: boolean;
  particleCount?: number;
  distance?: number;
}

export function HeartBurst({ show, particleCount = 6, distance = 22 }: HeartBurstProps) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {Array.from({ length: particleCount }).map((_, i) => {
            const angle = (i * (360 / particleCount) * Math.PI) / 180;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            return (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-ink dark:bg-off-white"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: dx, y: dy, opacity: 0, scale: 0.3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
