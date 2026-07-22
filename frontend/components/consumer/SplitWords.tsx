"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/consumer/motion";

interface SplitWordsProps {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  once?: boolean;
}

export function SplitWords({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.09,
  duration = 0.7,
  once = true,
}: SplitWordsProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <span className={className}>{text}</span>;
  }
  return (
    <span className={className}>
      {text.split(" ").map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden align-baseline"
          style={{ marginRight: "0.22em" }}
        >
          <motion.span
            className={wordClassName ?? "inline-block"}
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once, amount: 0.6 }}
            transition={{ delay: delay + i * stagger, duration, ease: EASE.out }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
