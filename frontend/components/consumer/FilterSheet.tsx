"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BottomSheet } from "./BottomSheet";
import { Button, TextLink } from "./Button";
import { Chip } from "./Chip";
import { ORIGINS } from "@/lib/consumer/data";
import { useApp } from "@/lib/consumer/store";
import type { Size } from "@/lib/consumer/types";

export interface Filters {
  priceMax: number;
  sizes: Size[];
  styles: string[];
  origins: string[];
  inStockOnly: boolean;
  sort: "Newest" | "Price Low-High" | "Price High-Low" | "Most Popular";
}

export const DEFAULT_FILTERS: Filters = {
  priceMax: 700,
  sizes: [],
  styles: [],
  origins: [],
  inStockOnly: false,
  sort: "Newest",
};

const SIZES: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
const SORTS: Filters["sort"][] = ["Newest", "Price Low-High", "Price High-Low", "Most Popular"];

export function filterCount(f: Filters): number {
  let n = 0;
  if (f.priceMax < 700) n++;
  if (f.sizes.length) n++;
  if (f.styles.length) n++;
  if (f.origins.length) n++;
  if (f.inStockOnly) n++;
  if (f.sort !== "Newest") n++;
  return n;
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  value: Filters;
  onApply: (f: Filters) => void;
}

export function FilterSheet({ open, onClose, value, onApply }: FilterSheetProps) {
  const { artStyles } = useApp();
  const [local, setLocal] = useState<Filters>(value);
  // sync when reopened
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setLocal(value);
  }

  const toggle = <K extends keyof Filters>(key: K, v: string) => {
    setLocal((prev) => {
      const arr = prev[key] as unknown as string[];
      const has = arr.includes(v);
      return { ...prev, [key]: has ? arr.filter((x) => x !== v) : [...arr, v] } as Filters;
    });
  };

  const apply = () => {
    onApply(local);
    onClose();
  };
  const reset = () => setLocal(DEFAULT_FILTERS);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filters"
      height={80}
      footer={
        <div className="flex items-center gap-3">
          <TextLink onClick={reset} className="min-h-11 shrink-0 px-2 text-mid-grey dark:text-white/70">
            Reset
          </TextLink>
          <Button variant="coral" full onClick={apply}>
            Apply Filters
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pb-2">
        <Section title="Price Range" defaultOpen>
          <div className="px-1">
            <div className="mb-2 flex items-center justify-between gap-4 text-sm font-bold text-ink dark:text-off-white">
              <span>GHS 0</span>
              <span className="text-right text-teal dark:text-white/80">up to GHS {local.priceMax}</span>
            </div>
            <input
              type="range"
              min={50}
              max={700}
              step={10}
              value={local.priceMax}
              onChange={(e) => setLocal((p) => ({ ...p, priceMax: Number(e.target.value) }))}
              className="w-full accent-teal dark:accent-white"
            />
          </div>
        </Section>

        <Section title="Size" defaultOpen>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <Chip
                key={s}
                size="sm"
                tone="teal"
                active={local.sizes.includes(s)}
                onClick={() => toggle("sizes", s)}
              >
                {s}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Style">
          <div className="flex flex-wrap gap-2">
            {artStyles.map((s) => (
              <Chip
                key={s.id}
                size="sm"
                tone="teal"
                active={local.styles.includes(s.id)}
                onClick={() => toggle("styles", s.id)}
              >
                {s.name}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Origin">
          <div className="flex flex-wrap gap-2">
            {ORIGINS.map((o) => (
              <Chip
                key={o}
                size="sm"
                tone="teal"
                active={local.origins.includes(o)}
                onClick={() => toggle("origins", o)}
              >
                {o}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Availability">
          <label className="flex items-center justify-between">
            <span className="font-display text-sm font-bold text-ink dark:text-off-white">In Stock only</span>
            <button
              type="button"
              role="switch"
              aria-checked={local.inStockOnly}
              onClick={() => setLocal((p) => ({ ...p, inStockOnly: !p.inStockOnly }))}
              className={cn(
                "relative h-7 w-12 rounded-full transition-colors",
                local.inStockOnly ? "bg-teal dark:bg-white" : "bg-line dark:bg-white/20"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
                  local.inStockOnly ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </label>
        </Section>

        <Section title="Sort">
          <div className="space-y-2">
            {SORTS.map((s) => (
              <label key={s} className="flex min-h-11 items-center gap-3 py-1">
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full border-2",
                    local.sort === s ? "border-teal dark:border-white" : "border-line dark:border-white/30"
                  )}
                >
                  {local.sort === s && <span className="h-2.5 w-2.5 rounded-full bg-teal dark:bg-white" />}
                </span>
                <input
                  type="radio"
                  name="sort"
                  className="hidden"
                  checked={local.sort === s}
                  onChange={() => setLocal((p) => ({ ...p, sort: s }))}
                />
                <span className="font-display text-sm font-bold text-ink dark:text-off-white">{s}</span>
              </label>
            ))}
          </div>
        </Section>
      </div>
    </BottomSheet>
  );
}

function Section({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-b border-line pb-4 dark:border-white/15">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between py-1"
      >
        <span className="font-display text-[15px] font-bold text-ink dark:text-off-white">{title}</span>
        <span className={cn("material-symbols-outlined text-[20px] text-mid-grey transition-transform dark:text-white/50", open && "rotate-180")}>expand_more</span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

// badge for the filter icon when filters active
export function FilterIcon({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Filters"
      className="relative grid h-11 w-11 shrink-0 place-items-center rounded-card bg-surface-low text-teal"
    >
      <span className="material-symbols-outlined text-[20px]">tune</span>
      {active && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral" />
      )}
    </button>
  );
}
