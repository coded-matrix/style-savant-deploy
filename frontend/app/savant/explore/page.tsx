"use client";

import { useMemo, useState, useEffect } from "react";
import { useApp } from "@/lib/consumer/store";
import { recommendationApi } from "@/lib/api/recommendation";
import { applyFilters, CATEGORIES } from "@/lib/consumer/filter";
import { DEFAULT_FILTERS, FilterSheet, FilterIcon, filterCount, type Filters } from "@/components/consumer/FilterSheet";
import { ProductCard } from "@/components/consumer/ProductCard";
import { BottomNav } from "@/components/consumer/BottomNav";
import { Eyebrow } from "@/components/consumer/Eyebrow";
import { Skeleton } from "@/components/consumer/Skeleton";
import { EmptyState } from "@/components/consumer/EmptyState";
import { Button } from "@/components/consumer/Button";
import { StaggerGrid } from "@/components/consumer/StaggerGrid";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import type { Category, Product } from "@/lib/consumer/types";

// Orchestrated open: the header pieces cascade in gently one after another
// instead of appearing all at once.
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const headerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.06 } },
};
const headerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export default function ExplorePage() {
  const router = useRouter();
  const { cartCount, artStyles } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category>("All");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recommendationApi.getExplore()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(
    () => applyFilters(products, "", filters, category, artStyles),
    [products, filters, category, artStyles]
  );

  const pickCategory = (c: Category) => {
    setCategory(c);
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-canvas-dark">
      {/* search bar + filter */}
      <motion.div
        variants={headerContainer}
        initial="hidden"
        animate="show"
        className="z-20 shrink-0 px-page-x desktop-frame pt-5 md:pt-8 pb-2"
      >
        <motion.div variants={headerItem}>
          <Eyebrow className="mb-3">Explore</Eyebrow>
        </motion.div>
        <motion.div variants={headerItem} className="flex items-center gap-3">
          <button
            onClick={() => router.push("/savant/search")}
            className="flex h-10 flex-1 items-center gap-2 rounded-card bg-surface-low dark:bg-white/5 px-3 text-mid-grey dark:text-white/60"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span className="text-[13px]">Search…</span>
          </button>
          <FilterIcon active={filterCount(filters) > 0} onClick={() => setFilterOpen(true)} />
          <button
            onClick={() => router.push("/savant/cart")}
            aria-label="Cart"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-surface-low dark:bg-white/5 text-ink dark:text-off-white relative hover:bg-surface-high dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-coral text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </motion.div>

        {/* category chips — editorial underline row, no pills */}
        <motion.div
          variants={headerItem}
          className="no-scrollbar -mx-page-x md:mx-0 mt-4 relative flex items-baseline gap-8 overflow-x-auto px-page-x md:px-0"
        >
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => pickCategory(c)}
                className={cn(
                  "relative shrink-0 whitespace-nowrap py-2 text-[11px] uppercase tracking-[0.28em] transition-colors duration-300",
                  active
                    ? "text-ink dark:text-off-white"
                    : "text-mid-grey/70 dark:text-white/40 hover:text-ink dark:hover:text-off-white"
                )}
              >
                {c}
                {active && (
                  <motion.span
                    layoutId="explore-category-underline"
                    className="absolute left-0 right-0 -bottom-px h-px bg-ink dark:bg-off-white"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
              </button>
            );
          })}
        </motion.div>
        <div className="-mx-page-x md:-mx-16 lg:-mx-24 -mt-px h-px bg-line/60 dark:bg-white/10" />

        {filterCount(filters) > 0 && (
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-ink/5 dark:bg-white/10 px-3 py-1 font-display text-[12px] font-bold text-ink dark:text-off-white"
          >
            {filterCount(filters)} filters active · Clear
          </button>
        )}
      </motion.div>

      <div className="no-scrollbar flex-1 overflow-y-auto desktop-frame pb-28 md:pb-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                <Skeleton className="mt-2 h-3 w-2/3" />
                <Skeleton className="mt-1 h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            illustration="grid"
            headline="Nothing here yet. More products coming soon."
            cta={
              <Button variant="tealOutline" full onClick={() => { setCategory("All"); setFilters(DEFAULT_FILTERS); }}>
                Browse all categories
              </Button>
            }
          />
        ) : (
          <>
            {/* campaign hero — first product full-bleed */}
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.22, ease: EASE_OUT }}
                className="mb-3 md:mb-6"
              >
                <ProductCard product={results[0]} aspect="aspect-[16/9] md:aspect-[21/9]" className="rounded-2xl" />
              </motion.div>
            )}
            {/* asymmetric editorial grid */}
            <StaggerGrid className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6" itemClassName="">
              {results.slice(1).map((p, i) => (
                <div key={p.id} className={cn(
                  i % 5 === 0 ? "col-span-2 row-span-2" : "",
                  i % 7 === 3 ? "row-span-2" : ""
                )}>
                  <ProductCard product={p} aspect={i % 5 === 0 ? "aspect-[3/4]" : i % 3 === 0 ? "aspect-[4/5]" : "aspect-[3/4]"} />
                </div>
              ))}
            </StaggerGrid>
          </>
        )}
      </div>

      <BottomNav />
      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} value={filters} onApply={setFilters} />
    </div>
  );
}
