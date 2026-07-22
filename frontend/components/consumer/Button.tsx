"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "coral" | "teal" | "tealOutline" | "greyOutline" | "ghost" | "white";
type Size = "lg" | "md" | "sm";

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
}

// Editorial buttons: grotesk, uppercase, tracked, flat (no shadow), hairline
// outlines that invert on hover. Pills for a soft-luxe silhouette.
const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-semibold uppercase tracking-[0.08em] transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface-bright disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  coral: "bg-ink dark:bg-white text-white dark:text-ink hover:bg-black dark:hover:bg-white/90 rounded-full",
  teal: "bg-ink dark:bg-white text-white dark:text-ink hover:bg-black dark:hover:bg-white/90 rounded-full",
  tealOutline: "border border-ink dark:border-white/30 text-ink dark:text-white bg-transparent hover:bg-ink hover:text-white dark:hover:bg-white/10 dark:hover:text-white rounded-full",
  greyOutline: "border border-line dark:border-white/15 text-ink dark:text-white bg-transparent hover:border-ink dark:hover:border-white/40 rounded-full",
  ghost: "text-ink dark:text-white hover:bg-surface-low dark:hover:bg-white/10 rounded-full",
  white: "bg-white text-ink border border-line hover:border-ink rounded-full",
};

const sizes: Record<Size, string> = {
  lg: "h-btn-lg lg:h-btn-d w-full px-6 text-[13px] lg:text-[14px]",
  md: "h-btn-md lg:h-btn-d px-6 text-[12px] lg:text-[13px]",
  sm: "h-9 px-4 text-[11px]",
};

export const Button = React.forwardRef<HTMLButtonElement, BtnProps>(
  ({ className, variant = "coral", size = "lg", loading, full, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], full && "w-full", className)}
      {...props}
    >
      {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
      {children}
    </button>
  )
);
Button.displayName = "Button";

// Text-only teal link button (used for secondary actions)
export function TextLink({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-ink underline-offset-4 hover:underline",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
