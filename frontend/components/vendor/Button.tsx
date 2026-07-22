"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "greyOutline" | "danger" | "ghost";
type Size = "lg" | "md" | "sm";

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-bold uppercase tracking-[0.08em] transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-ink dark:bg-white text-white dark:text-ink hover:bg-black dark:hover:bg-white/90 rounded-full",
  secondary: "border border-ink dark:border-white/20 text-ink dark:text-white/80 bg-transparent hover:bg-ink hover:text-white rounded-full",
  greyOutline: "border border-line dark:border-white/15 text-ink dark:text-white bg-transparent hover:border-ink dark:hover:border-white/40 rounded-full",
  danger: "bg-error text-white hover:opacity-90 rounded-full",
  ghost: "text-ink dark:text-white/70 hover:bg-surface-low dark:hover:bg-white/10 rounded-full",
};

const sizes: Record<Size, string> = {
  lg: "h-btn-lg px-6 text-v-body",
  md: "h-btn-md px-5 text-v-tsm",
  sm: "h-9 px-4 text-v-meta",
};

export const Button = React.forwardRef<HTMLButtonElement, BtnProps>(
  ({ className, variant = "primary", size = "md", loading, full, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], full && "w-full", className)}
      {...props}
    >
      {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export function TextLink({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "font-sans text-v-meta font-bold uppercase tracking-[0.08em] text-ink dark:text-off-white underline-offset-4 hover:underline",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
