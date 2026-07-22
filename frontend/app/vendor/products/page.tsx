"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { useVendor } from "@/context/VendorContext";
import {
  PageHeader,
  Chip,
  ProductStatusBadge,
  Thumb,
  EmptyState,
} from "@/components/vendor/shared";
import type { ProductStatus } from "@/lib/vendor/types";
import { formatCurrency } from "@/lib/utils";

const FILTERS: (ProductStatus | "all")[] = [
  "all",
  "active",
  "draft",
  "sold_out",
  "archived",
];
const FILTER_LABELS: Record<string, string> = {
  all: "All",
  active: "Active",
  draft: "Draft",
  sold_out: "Sold Out",
  archived: "Archived",
};

export default function ProductsPage() {
  const { products } = useVendor();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<ProductStatus | "all">("all");

  useMemo(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { active: 0, draft: 0, archived: 0 };
    products.forEach((p) => {
      if (p.status === "active" || p.status === "draft" || p.status === "archived")
        c[p.status]++;
    });
    return c;
  }, [products]);

  const filtered = products
    .filter((p) => (filter === "all" ? true : p.status === filter))
    .filter((p) =>
      debounced
        ? `${p.name} ${p.sku}`.toLowerCase().includes(debounced.toLowerCase())
        : true,
    );

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${counts.active} active · ${counts.draft} drafts · ${counts.archived} archived`}
        action={
          <Link
            href="/vendor/products/new"
            className="flex items-center gap-1 rounded-full bg-vendor-coral-bright px-5 py-3 lg:h-btn-d text-v-body font-bold text-white"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        }
      />

        <div className="space-y-6 lg:space-y-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mid-grey" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products or SKU…"
              className="vendor-input rounded-full pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar lg:mb-2">
          {FILTERS.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {FILTER_LABELS[f]}
            </Chip>
          ))}
        </div>

        {/* Desktop: grid card layout | Mobile: list layout */}
        <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="No products match your search."
                hint="Clear the search or adjust the filter."
              />
            </div>
          ) : (
            filtered.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/vendor/products/edit/${p.id}`}
                  className="group block rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark overflow-hidden transition-all hover:shadow-lg hover:shadow-ink/5 dark:hover:shadow-black/20 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[4/3] bg-surface-low dark:bg-white/[0.03] overflow-hidden">
                    {p.images && p.images.length > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Thumb name={p.name} className="h-20 w-20 rounded-2xl" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <ProductStatusBadge status={p.status} />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-v-body font-bold text-ink dark:text-white/90 group-hover:text-teal dark:group-hover:text-off-white transition-colors">{p.name}</p>
                        <p className="text-v-meta text-vendor-text-grey mt-0.5">{p.sku}</p>
                      </div>
                      <span className="shrink-0 text-v-body font-bold text-ink dark:text-white/90">
                        {formatCurrency(p.price)}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span
                        className={`text-v-meta font-medium ${
                          p.stock === 0
                            ? "text-vendor-danger"
                            : p.stock <= 3
                              ? "text-vendor-amber"
                              : "text-ink dark:text-white/90"
                        }`}
                      >
                        {p.stock} in stock
                      </span>
                      {p.images && p.images.length > 1 ? (
                        <span className="text-v-meta text-vendor-text-grey">+{p.images.length - 1} more</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>

        {/* Mobile: image-based card grid */}
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {filtered.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="No products match your search."
                hint="Clear the search or adjust the filter."
              />
            </div>
          ) : (
            filtered.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/vendor/products/edit/${p.id}`}
                  className={`group block rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark overflow-hidden ${
                    p.status === "sold_out" ? "bg-vendor-red-tint" : ""
                  }`}
                >
                  <div className="relative aspect-square bg-surface-low dark:bg-white/[0.03] overflow-hidden">
                    {p.images && p.images.length > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Thumb name={p.name} className="h-14 w-14 rounded-xl" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <ProductStatusBadge status={p.status} />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-v-body font-bold text-ink dark:text-white/90">{p.name}</p>
                    <p className="text-v-meta text-vendor-text-grey mt-0.5">{p.sku}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={`text-v-meta font-medium ${
                          p.stock === 0
                            ? "text-vendor-danger"
                            : p.stock <= 3
                              ? "text-vendor-amber"
                              : "text-ink dark:text-white/90"
                        }`}
                      >
                        {p.stock} in stock
                      </span>
                      <span className="text-v-body font-bold text-ink dark:text-white/90">
                        {formatCurrency(p.price)}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
