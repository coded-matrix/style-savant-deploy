"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { EASE } from "@/lib/consumer/motion";

export default function SavantTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{
          opacity: { duration: 0.3 },
          y: { duration: 0.55, ease: EASE.out },
        }}
        className="h-full"
      >
        {/* film-cel flicker between route changes */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-[9998] bg-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.35, 0] }}
          transition={{ duration: 0.2, ease: "linear" }}
          aria-hidden
          key={`flicker-${pathname}`}
        />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
