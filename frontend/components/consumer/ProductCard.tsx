"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/consumer/store";
import { ghs } from "@/lib/consumer/format";
import type { Product } from "@/lib/consumer/types";
import { SmartImage } from "./SmartImage";

interface ProductCardProps {
  product: Product;
  className?: string;
  aspect?: string;
}

export function ProductCard({ product, className, aspect = "aspect-[3/4]" }: ProductCardProps) {
  const { likedProductIds, toggleLikeProduct } = useApp();
  const liked = likedProductIds.includes(product.id);
  return (
    <Link
      href={`/savant/product/${product.id}`}
      className={cn("group block overflow-hidden rounded-xl bg-white ring-1 ring-line/50 dark:bg-surface-dark dark:ring-white/10 transition-transform duration-500 ease-out hover:-translate-y-0.5 hover:ring-ink/30 active:scale-[0.96]", className)}
    >
      <div className={cn("relative w-full overflow-hidden rounded-t-xl", aspect)}>
        <SmartImage
          src={product.images[0]}
          alt={product.name}
          seed={product.id}
          label={product.name}
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03] group-active:scale-[1.06]"
        />
        {/* heart */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleLikeProduct(product.id);
          }}
          aria-label={liked ? "Unlike" : "Like"}
          className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-sm"
        >
          <span className={cn(
              "material-symbols-outlined text-[18px] transition-all",
              liked ? "scale-110 text-coral animate-pop" : "text-mid-grey hover:text-coral"
            )}
            style={liked ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >favorite</span>
        </button>
        {product.soldOut && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 rotate-[-8deg] bg-ink/65 py-1.5 text-center font-display text-sm font-bold uppercase tracking-widest text-white">
              Sold Out
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-mid-grey truncate">
          {product.vendorName}
        </p>
        <h3 className="mt-1 truncate font-serif text-[16px] md:text-[18px] leading-snug font-normal text-ink dark:text-off-white">
          {product.name}
        </h3>
        <p className="mt-1 text-[14px] font-normal tabular-nums tracking-[0.08em] text-mid-grey dark:text-white/60">{ghs(product.priceGHS)}</p>
      </div>
    </Link>
  );
}
