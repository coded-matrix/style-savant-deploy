"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export default function VendorTemplate({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
    >
      {children}
    </motion.div>
  );
}
