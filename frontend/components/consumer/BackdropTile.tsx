"use client";

import { cn } from "@/lib/utils";
import { ghs } from "@/lib/consumer/format";
import type { Backdrop } from "@/lib/consumer/types";
import { SmartImage } from "./SmartImage";

interface BackdropTileProps {
  backdrop: Backdrop;
  selected?: boolean;
  owned?: boolean;
  onClick?: () => void;
  className?: string;
  aspect?: string;
}

export function BackdropTile({
  backdrop,
  selected,
  owned,
  onClick,
  className,
  aspect = "aspect-[5/7]",
}: BackdropTileProps) {
  const locked = backdrop.premium && !owned;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("w-full text-left", className)}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl transition-all",
          aspect,
          selected
            ? "ring-[3px] ring-coral scale-[1.02]"
            : "ring-1 ring-surface-high dark:ring-white/15",
          locked && "cursor-not-allowed opacity-80"
        )}
      >
        <SmartImage
          src={backdrop.image}
          alt={backdrop.name}
          seed={backdrop.id}
          label={backdrop.name}
          className={cn("h-full w-full", locked && "grayscale-[30%]")}
        />

        {/* bottom gradient + name overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="font-display text-[13px] font-bold text-white truncate">{backdrop.name}</p>
        </div>

        {/* selected checkmark */}
        {selected && (
          <span className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full bg-coral text-white shadow">
            <span className="material-symbols-outlined text-[14px]">check</span>
          </span>
        )}

        {/* premium badge — uses tertiary colors per reference */}
        {backdrop.premium && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-clay/90 px-2 py-0.5 font-display text-[10px] font-bold text-white">
            <span className="material-symbols-outlined text-[10px]">lock</span> PRO
          </span>
        )}

        {/* locked overlay */}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-dark-grey/80 backdrop-blur-sm">
              <span className="material-symbols-outlined text-[20px] text-white">lock</span>
            </span>
          </div>
        )}
      </div>

      {/* below tile metadata */}
      <div className="mt-1 flex items-center justify-between">
        <p className="truncate text-[11px] text-mid-grey dark:text-white/50">{backdrop.artistName}</p>
        {backdrop.premium ? (
          <span className="shrink-0 font-display text-[11px] font-bold text-coral dark:text-off-white">
            {owned ? "Owned" : ghs(backdrop.priceGHS ?? 0)}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-surface-low dark:bg-white/10 px-2 py-0.5 font-display text-[10px] font-bold text-mid-grey dark:text-white/60">
            FREE
          </span>
        )}
      </div>
    </button>
  );
}
