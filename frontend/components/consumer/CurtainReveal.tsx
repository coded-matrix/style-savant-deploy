"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/consumer/motion";

interface CurtainRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  color?: string;
  className?: string;
  /**
   * "mount" (default): curtain plays once as soon as the component mounts —
   * right for single hero surfaces (product carousel, page-load reveal).
   * "inView": curtain plays when the wrapper enters the viewport — right for
   * repeated content like the feed where each card should reveal as the user
   * scrolls to it.
   */
  trigger?: "mount" | "inView";
  amount?: number;
}

export function CurtainReveal({
  children,
  delay = 0.2,
  duration = 1.1,
  color = "bg-ink",
  className,
  trigger = "mount",
  amount = 0.4,
}: CurtainRevealProps) {
  const reduce = useReducedMotion();
  const shared = {
    className: `absolute inset-0 z-30 pointer-events-none ${color}`,
    initial: { y: "0%" as const },
    transition: { delay, duration, ease: EASE.reveal },
    "aria-hidden": true,
  };
  return (
    // h-full w-full so the wrapper preserves the height chain — the children
    // often use `fill` (SmartImage) which requires a definite-size positioned
    // parent, and the curtain itself is absolute-positioned against this box.
    <div className={`relative h-full w-full overflow-hidden ${className ?? ""}`}>
      {children}
      {!reduce && (
        trigger === "inView" ? (
          <motion.div
            {...shared}
            whileInView={{ y: "-101%" }}
            viewport={{ once: true, amount }}
          />
        ) : (
          <motion.div {...shared} animate={{ y: "-101%" }} />
        )
      )}
    </div>
  );
}
