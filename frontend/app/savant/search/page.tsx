"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/consumer/store";
import { RECENT_SEARCHES, POPULAR_SEARCHES } from "@/lib/consumer/data";
import { motion } from "framer-motion";
import { applyFilters } from "@/lib/consumer/filter";
import { DEFAULT_FILTERS, FilterSheet, FilterIcon, filterCount, type Filters } from "@/components/consumer/FilterSheet";
import { ProductCard } from "@/components/consumer/ProductCard";
import { Skeleton } from "@/components/consumer/Skeleton";
import { Chip } from "@/components/consumer/Chip";
import { EmptyState } from "@/components/consumer/EmptyState";
import { Button } from "@/components/consumer/Button";

export default function SearchPage() {
  const router = useRouter();
  const { products, artStyles } = useApp();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [searching, setSearching] = useState(false);
  const [recent, setRecent] = useState<string[]>(RECENT_SEARCHES);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setDebounced("");
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      setDebounced(query);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(
    () => applyFilters(products, debounced, filters, undefined, artStyles),
    [products, debounced, filters, artStyles]
  );

  const runSearch = (q: string) => {
    setQuery(q);
    if (q.trim()) {
      setRecent((prev) => [q, ...prev.filter((x) => x !== q)].slice(0, 5));
    }
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-canvas-dark">
      {/* search header */}
      <div className="z-20 shrink-0 flex items-center gap-2 px-page-x pb-3 pt-5">
        <button onClick={() => router.back()} aria-label="Back" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink dark:text-off-white hover:bg-surface-low">
          <span className="material-symbols-outlined text-[24px]">chevron_left</span>
        </button>
        <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-card border border-transparent bg-surface-low px-3.5 transition-colors focus-within:border-ink/20 dark:bg-white/10 dark:focus-within:border-white/25 dark:focus-within:bg-white/15">
          <span className="material-symbols-outlined text-[20px] text-mid-grey dark:text-white/60">search</span>
          <input
            ref={inputRef}
            value={query}
            maxLength={100}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search styles, artists, vendors…"
            className="min-w-0 w-full appearance-none border-0 bg-transparent p-0 text-body-md text-ink outline-none placeholder:text-mid-grey/70 focus:bg-transparent focus:outline-none focus:ring-0 dark:bg-transparent dark:text-off-white dark:placeholder:text-white/60 dark:focus:bg-transparent"
          />
          {searching && <span className="material-symbols-outlined text-[16px] animate-spin text-mid-grey dark:text-white/60">progress_activity</span>}
          {query && !searching && (
            <button onClick={() => setQuery("")} aria-label="Clear" className="text-mid-grey dark:text-white/60 hover:text-ink dark:hover:text-off-white">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
        <FilterIcon active={filterCount(filters) > 0} onClick={() => setFilterOpen(true)} />
      </div>

      {filterCount(filters) > 0 && (
        <div className="px-page-x pb-2">
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="inline-flex items-center gap-1.5 rounded-pill bg-coral/10 px-3 py-1 font-display text-[12px] font-bold text-coral"
          >
            {filterCount(filters)} filters active · Clear
          </button>
        </div>
      )}

      <div className="no-scrollbar flex-1 overflow-y-auto px-card-x pb-6">
        {!debounced ? (
          <div className="px-page-x pt-2">
            {/* recent */}
            {recent.length > 0 && (
              <div className="mb-6">
                <p className="font-display text-sm font-bold text-ink dark:text-off-white">Recent Searches</p>
                <div className="mt-3 space-y-1">
                  {recent.map((r) => (
                    <div key={r} className="flex items-center justify-between py-2 hover:bg-surface-low dark:hover:bg-white/5">
                      <button
                        onClick={() => runSearch(r)}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <span className="material-symbols-outlined text-[16px] text-mid-grey dark:text-white/60">schedule</span>
                        <span className="text-body-md text-ink dark:text-off-white">{r}</span>
                      </button>
                      <button
                        onClick={() => setRecent((prev) => prev.filter((x) => x !== r))}
                        aria-label="Remove"
                        className="text-mid-grey dark:text-white/60"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* popular */}
            <div>
              <p className="font-display text-sm font-bold text-ink dark:text-off-white">Popular Searches</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((p) => (
                  <Chip key={p} size="sm" tone="teal" onClick={() => runSearch(p)}>
                    {p}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="px-page-x pt-2 font-display text-sm font-bold text-mid-grey dark:text-white/60">
              {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{debounced}&rdquo;
            </p>
            {searching ? (
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-card" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                illustration="search"
                headline={`No results for "${debounced}". Try a different keyword.`}
                cta={
                  <Button variant="tealOutline" full onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                {results.map((p, index) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} value={filters} onApply={setFilters} />
    </div>
  );
}
