"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface StaggerGridProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
}

export function StaggerGrid({ children, className, itemClassName }: StaggerGridProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <div className={className}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          // Reveal each card as it scrolls into view (not just on mount), with a
          // gentle per-row stagger. `once` keeps it settled after the first pass.
          // Transform + opacity only — no blur — so it stays smooth on mobile.
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.15, margin: "0px 0px -12% 0px" }}
          transition={{
            duration: 0.6,
            delay: (i % 4) * 0.07,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={itemClassName}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
