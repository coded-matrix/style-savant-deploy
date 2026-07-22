"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface TopBarProps {
  title?: string;
  titleClassName?: string;
  onBack?: () => void;
  backHref?: string;
  right?: ReactNode;
  left?: ReactNode;
  className?: string;
  sticky?: boolean;
  tone?: "light" | "dark";
}

export function TopBar({
  title,
  titleClassName,
  onBack,
  backHref,
  right,
  left,
  className,
  sticky = true,
  tone = "light",
}: TopBarProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => (backHref ? router.push(backHref) : router.back()));
  const isDark = tone === "dark";
  return (
    <div
      className={cn(
        "z-30 flex h-14 items-center justify-between gap-2 px-page-x",
        sticky && "sticky top-0",
        isDark ? "text-white" : "text-ink dark:text-off-white",
        className
      )}
    >
      <div className="flex min-w-10 items-center">
        {left ?? (
          <button
            onClick={handleBack}
            aria-label="Back"
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full transition-colors",
              isDark ? "hover:bg-white/15" : "hover:bg-surface-low dark:hover:bg-white/5"
            )}
          >
            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
          </button>
        )}
      </div>
      {title && (
        <h1 className={cn("absolute left-1/2 -translate-x-1/2 font-serif text-[26px] md:text-[32px] font-normal leading-[0.95] tracking-tight", titleClassName)}>
          {title}
        </h1>
      )}
      <div className="flex min-w-10 items-center justify-end gap-1">{right}</div>
    </div>
  );
}
