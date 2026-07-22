"use client";

import { cn } from "@/lib/utils";
import type { Product, Size } from "@/lib/consumer/types";

interface SizeSelectorProps {
  product: Product;
  value?: Size;
  onChange: (s: Size) => void;
  /** recommended size to highlight */
  recommended?: Size;
  /** fill colour for selected pill */
  selectedTone?: "teal" | "coral";
  /** show the "Recommended" label */
  showRecommendedLabel?: boolean;
  onErrorShake?: boolean;
}

export function SizeSelector({
  product,
  value,
  onChange,
  recommended,
  selectedTone = "teal",
  showRecommendedLabel = false,
  onErrorShake = false,
}: SizeSelectorProps) {
  const stock = product.stockBySize;
  const onlyOne = product.sizes.length <= 1;

  if (onlyOne) {
    return (
      <div>
        <p className="mb-1.5 font-display text-label-bold text-ink dark:text-off-white">Select Size</p>
        <span className="inline-flex h-10 items-center rounded-pill bg-surface-low dark:bg-white/10 px-4 font-display text-sm font-bold text-ink-variant dark:text-off-white">
          One size
        </span>
      </div>
    );
  }

  return (
    <div className={cn("w-full", onErrorShake && "animate-shake")}>
      {showRecommendedLabel && recommended && (
        <p className="mb-1.5 text-caption font-bold text-teal dark:text-off-white flex items-center gap-1.5">
          <svg
            viewBox="0 0 100 100"
            className="h-4.5 w-4.5 shrink-0 stroke-current fill-none"
            strokeWidth="8"
            aria-hidden="true"
          >
            <circle cx="36" cy="36" r="20" />
            <circle cx="64" cy="36" r="20" />
            <circle cx="36" cy="64" r="20" />
            <circle cx="64" cy="64" r="20" />
          </svg>
          Recommended size: {recommended}
        </p>
      )}
      {!showRecommendedLabel && (
        <p className="mb-1.5 font-display text-label-bold text-ink dark:text-off-white">Select Size</p>
      )}
      <div className="flex flex-wrap gap-2">
        {product.sizes.map((s) => {
          const inStock = stock ? stock[s] !== false : !product.soldOut;
          const isSelected = value === s;
          const isRecommended = recommended && s === recommended && !isSelected;
          return (
            <button
              key={s}
              disabled={!inStock}
              onClick={() => onChange(s)}
              className={cn(
                "relative h-10 min-w-11 rounded-pill border-2 px-3 font-display text-sm font-bold transition-all active:scale-95",
                !inStock && "cursor-not-allowed border-line bg-surface-low text-mid-grey line-through",
                inStock && !isSelected && !isRecommended && "border-line bg-white text-ink hover:border-teal dark:border-white/20 dark:bg-transparent dark:text-off-white dark:hover:border-white/50",
                inStock && isRecommended && "border-teal text-teal dark:border-white dark:text-off-white",
                inStock && isSelected && selectedTone === "teal" && "border-teal bg-teal text-white dark:border-white dark:bg-white dark:text-ink",
                inStock && isSelected && selectedTone === "coral" && "border-coral bg-coral text-white dark:border-white dark:bg-white dark:text-ink"
              )}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}
