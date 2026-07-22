"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/consumer/store";
import { ghs } from "@/lib/consumer/format";
import type { Product } from "@/lib/consumer/types";
import { SmartImage } from "./SmartImage";

interface VendorProductTileProps {
  product: Product;
  className?: string;
  aspect?: string;
  featured?: boolean;
}

// Editorial monochrome product tile for the vendor storefront. Flat (no
// shadow), hairline ring, slow zoom-on-hover, wipe-in name underline, light
// price. Isolated from ProductCard so the shared card (used elsewhere in the
// app) is untouched.
export function VendorProductTile({ product, className, aspect = "aspect-[3/4]", featured }: VendorProductTileProps) {
  const { likedProductIds, toggleLikeProduct } = useApp();
  const liked = likedProductIds.includes(product.id);

  return (
    <Link
      href={`/savant/product/${product.id}`}
      className={cn(
        "group block overflow-hidden rounded-xl bg-white ring-1 ring-line dark:bg-surface-dark dark:ring-white/10 transition-transform duration-500 ease-out hover:-translate-y-1",
        className
      )}
    >
      <div className={cn("relative w-full overflow-hidden", aspect)}>
        <SmartImage
          src={product.images[0]}
          alt={product.name}
          seed={product.id}
          label={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        {/* quiet like — monochrome, no candy accent */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleLikeProduct(product.id);
          }}
          aria-label={liked ? "Unlike" : "Like"}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/70 dark:bg-black/50 backdrop-blur-sm transition-colors"
        >
          <span
            className={cn("material-symbols-outlined text-[18px] transition-all", liked ? "scale-110 text-ink dark:text-white" : "text-mid-grey hover:text-ink dark:hover:text-white")}
            style={liked ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            favorite
          </span>
        </button>

        {product.soldOut && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 rotate-[-8deg] bg-ink/70 py-1.5 text-center font-display text-[11px] font-bold uppercase tracking-[0.25em] text-white">
              Sold Out
            </div>
          </div>
        )}
      </div>

      <div className={cn("p-4", featured && "md:p-5")}>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-mid-grey dark:text-white/50 truncate">
          {product.category}
        </p>
        <h3
          className={cn(
            "mt-1.5 truncate font-serif font-normal text-ink dark:text-off-white",
            featured ? "text-[22px] md:text-[26px] leading-tight" : "text-[17px] leading-snug",
            "bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[length:0%_1px] bg-left-bottom transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]"
          )}
        >
          {product.name}
        </h3>
        <p className="mt-2 font-display text-[14px] font-normal tabular-nums tracking-wide text-ink dark:text-off-white">
          {ghs(product.priceGHS)}
        </p>
      </div>
    </Link>
  );
}
