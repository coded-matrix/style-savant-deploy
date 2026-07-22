"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Illustration =
  | "podium"
  | "grid"
  | "search"
  | "cart"
  | "hanger"
  | "heart"
  | "frame"
  | "sparkle"
  | "plug";

export function EmptyState({
  illustration = "sparkle",
  headline,
  cta,
  className,
}: {
  illustration?: Illustration;
  headline: string;
  cta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-8 py-20 text-center", className)}>
      <p className="max-w-[280px] font-serif text-[26px] md:text-[32px] font-normal leading-[1.1] text-ink dark:text-white text-balance">
        {headline}
      </p>
      {cta && <div className="mt-8 w-full max-w-[260px]">{cta}</div>}
    </div>
  );
}
