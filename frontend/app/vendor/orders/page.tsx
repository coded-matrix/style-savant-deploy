"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useVendor } from "@/context/VendorContext";
import { PageHeader, Chip, OrderStatusBadge, EmptyState } from "@/components/vendor/shared";
import type { OrderStatus } from "@/lib/vendor/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const FILTERS: (OrderStatus | "all")[] = [
  "all",
  "pending",
  "shipped",
  "delivered",
  "cancelled",
];

export default function OrdersPage() {
  const { orders, updateOrder } = useVendor();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [trackingFor, setTrackingFor] = useState<string | null>(null);
  const [trackingVal, setTrackingVal] = useState("");

  useMemo(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const isOverdue = (date: string, status: OrderStatus) =>
    status === "pending" && Date.now() - +new Date(date) > 48 * 3600 * 1000;

  const filtered = orders
    .filter((o) => (filter === "all" ? true : o.status === filter))
    .filter((o) =>
      debounced
        ? `${o.id} ${o.customer}`.toLowerCase().includes(debounced.toLowerCase())
        : true,
    );

  const saveTracking = (id: string) => {
    updateOrder(id, { tracking: trackingVal, status: "shipped" });
    setTrackingFor(null);
    setTrackingVal("");
  };

  return (
    <div>
      <PageHeader title="Orders" subtitle="Manage customer orders" />

      <div className="space-y-6 lg:space-y-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mid-grey" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order # or customer…"
              className="vendor-input rounded-full pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
            </Chip>
          ))}
        </div>

        {/* Desktop: grid card layout | Mobile: simple list */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="No orders received yet"
                hint="Share your storefront to start selling."
              />
            </div>
          ) : (
            filtered.map((o, index) => {
              const overdue = isOverdue(o.date, o.status);
              const cancelled = o.status === "cancelled";
              return (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className={`rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark overflow-hidden transition-all hover:shadow-lg hover:shadow-ink/5 dark:hover:shadow-black/20 ${
                    overdue ? "border-l-2 border-l-ink dark:border-l-white/50" : ""
                  } ${cancelled ? "opacity-50" : ""}`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-v-body font-bold text-teal dark:text-off-white">{o.id}</p>
                        <p className="text-v-meta text-vendor-text-grey mt-0.5">
                          {formatDate(o.date)} · {o.customer}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-v-body font-bold tabular-nums text-ink dark:text-white/90">
                          {formatCurrency(o.total)}
                        </p>
                        <div className="mt-1">
                          <OrderStatusBadge status={o.status} />
                        </div>
                      </div>
                    </div>
                    {overdue ? (
                      <p className="mt-2 text-v-meta text-vendor-amber font-medium">Overdue</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2 border-t border-line dark:border-white/10 px-4 py-2.5 bg-surface-low/50 dark:bg-white/[0.02]">
                    <Link
                      href={`/vendor/orders/${o.id}`}
                      className="flex items-center gap-1 rounded-full border border-line dark:border-white/10 px-3 py-1.5 text-v-meta font-medium text-ink dark:text-white/90 hover:bg-surface-low dark:hover:bg-white/5 transition-colors"
                    >
                      <Eye className="h-3 w-3" /> View
                    </Link>
                    {o.status === "confirmed" ? (
                      trackingFor === o.id ? (
                        <div className="flex flex-1 gap-2">
                          <input
                            value={trackingVal}
                            onChange={(e) => setTrackingVal(e.target.value)}
                            placeholder="Tracking # (EA123456789GH)"
                            className="vendor-input flex-1 py-1 text-v-meta"
                          />
                          <button
                            onClick={() => saveTracking(o.id)}
                            className="rounded-full bg-teal px-3 py-1.5 text-v-meta font-medium text-white"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setTrackingFor(o.id)}
                          className="rounded-full bg-vendor-coral-bright px-3 py-1.5 text-v-meta font-medium text-white"
                        >
                          Mark Shipped
                        </button>
                      )
                    ) : null}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Mobile: simple list layout */}
        <div className="overflow-hidden rounded-lg border border-line bg-white dark:border-white/10 dark:bg-surface-dark lg:hidden">
          {filtered.length === 0 ? (
            <EmptyState
              title="No orders received yet"
              hint="Share your storefront to start selling."
            />
          ) : (
            filtered.map((o, index) => {
              const overdue = isOverdue(o.date, o.status);
              const cancelled = o.status === "cancelled";
              return (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className={`border-t border-line dark:border-white/10 px-5 py-5 first:border-t-0 ${
                    overdue ? "border-l-2 border-l-ink dark:border-l-white/50" : ""
                  } ${cancelled ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-v-body font-bold text-teal dark:text-off-white">{o.id}</p>
                      <p className="text-v-meta text-vendor-text-grey">
                        {formatDate(o.date)} · {o.customer}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-v-body font-bold">
                        {formatCurrency(o.total)}
                      </span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </div>
                  {overdue ? (
                    <p className="mt-1 text-v-meta text-vendor-amber">Overdue</p>
                  ) : null}
                   <div className="mt-2 flex gap-2">
                    <Link
                      href={`/vendor/orders/${o.id}`}
                      className="flex items-center gap-1 rounded-full border border-line dark:border-white/10 px-5 py-2.5 lg:h-btn-d text-v-meta font-bold text-ink dark:text-white/90"
                    >
                      <Eye className="h-3 w-3" /> View
                    </Link>
                    {o.status === "confirmed" ? (
                      trackingFor === o.id ? (
                        <div className="flex flex-1 gap-2">
                          <input
                            value={trackingVal}
                            onChange={(e) => setTrackingVal(e.target.value)}
                            placeholder="Tracking # (EA123456789GH)"
                            className="vendor-input flex-1 py-1 text-v-meta"
                          />
                          <button
                            onClick={() => saveTracking(o.id)}
                            className="rounded-full bg-teal px-5 py-2.5 lg:h-btn-d text-v-meta font-bold text-white"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setTrackingFor(o.id)}
                          className="rounded-full bg-vendor-coral-bright px-5 py-2.5 lg:h-btn-d text-v-meta font-bold text-white"
                        >
                          Mark Shipped
                        </button>
                      )
                    ) : null}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
