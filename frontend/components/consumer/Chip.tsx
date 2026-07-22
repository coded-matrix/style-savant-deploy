"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  tone?: "coral" | "teal";
  variant?: "filled" | "outlined";
  size?: "sm" | "md";
}

export function Chip({
  active,
  onClick,
  children,
  className,
  tone = "coral",
  variant = "filled",
  size = "md",
}: ChipProps) {
  const isOutlined = variant === "outlined";
  return (
    <button
      type="button"
      onClick={onClick}
      role="button"
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-pill font-display font-bold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2",
        size === "sm" ? "h-8 px-3.5 text-[11px]" : "h-9 px-4 text-[12px]",
        // Editorial treatment for the outlined (category) chips.
        isOutlined && "uppercase tracking-[0.08em]",
        isOutlined
          ? active
            ? tone === "teal"
              ? "border border-ink bg-ink text-white shadow-sm dark:border-off-white dark:bg-off-white dark:text-ink"
              : "border-[2px] border-coral bg-coral-50 text-coral"
            : "border border-line bg-transparent text-ink-variant hover:border-ink/40 hover:text-ink dark:border-white/15 dark:text-white/55 dark:hover:border-white/40 dark:hover:text-white"
          : active
            ? tone === "coral"
              ? "bg-coral text-white"
              : "bg-teal text-white"
            : "bg-surface-low text-ink-variant hover:bg-surface",
        className
      )}
    >
      {children}
    </button>
  );
}
