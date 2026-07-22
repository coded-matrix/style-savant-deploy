"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { EASE } from "@/lib/consumer/motion";

interface FadeInProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "whileInView" | "transition" | "viewport"> {
  delay?: number;
  y?: number;
  duration?: number;
  amount?: number;
  once?: boolean;
}

export function FadeIn({
  children,
  delay = 0,
  y = 16,
  duration = 0.7,
  amount = 0.4,
  once = true,
  ...rest
}: FadeInProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once, amount }}
        transition={{ duration: 0.2 }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ delay, duration, ease: EASE.out }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
