"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/consumer/motion";

interface SwipeTooltipProps {
  show: boolean;
}

export function SwipeTooltip({ show }: SwipeTooltipProps) {
  const reduce = useReducedMotion();
  if (reduce || !show) return null;
  return (
    <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -6] }}
        transition={{ duration: 3.2, times: [0, 0.15, 0.85, 1], ease: EASE.out }}
        viewport={{ once: true, amount: 0.5 }}
      >
        <div className="flex items-center gap-3 rounded-full bg-black/40 backdrop-blur-md px-5 py-2.5">
          <span className="h-px w-3 bg-white/60" />
          <span className="material-symbols-outlined text-[14px] text-white">swipe</span>
          <span className="text-[10px] uppercase tracking-[0.28em] text-white">Swipe to try on</span>
          <span className="h-px w-3 bg-white/60" />
        </div>
      </motion.div>
    </div>
  );
}
