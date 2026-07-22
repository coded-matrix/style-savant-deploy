"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Megaphone,
  Coins,
  AlertTriangle,
} from "lucide-react";
import { useVendor } from "@/context/VendorContext";
import { PageHeader, StatCard, ProductStatusBadge, OrderStatusBadge, EmptyState } from "@/components/vendor/shared";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { products, orders, tokens } = useVendor();

  const activeListings = products.filter((p) => p.status === "active").length;
  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "confirmed",
  ).length;
  const monthSales = useMemo(
    () =>
      orders
        .filter((o) => o.status === "delivered" || o.status === "shipped")
        .reduce((s, o) => s + o.total, 0),
    [orders],
  );

  const lowToken = tokens < 200;

  const recentOrders = [...orders]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 5);

  const lowStock = products.filter(
    (p) => p.status !== "archived" && p.stock <= 3,
  );

  const isOverdue = (date: string) =>
    Date.now() - +new Date(date) > 48 * 3600 * 1000;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back to your vendor portal"
      />

      {lowToken ? (
        <Link
          href="/vendor/tokens"
          className="flex items-center gap-2 rounded-xl bg-ink/5 dark:bg-white/5 px-5 py-3 text-sm font-bold text-ink dark:text-white/90 mb-8"
        >
          <AlertTriangle className="h-4 w-4" />
          Low token balance: {tokens} tokens remaining. Top up &rarr;
        </Link>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7 mb-12 lg:mb-14">
        <StatCard label="Active Listings" value={activeListings} tone="teal" sub={`${products.length} total`} />
        <StatCard label="Pending Orders" value={pendingOrders} tone="coral" sub="need action" />
        <StatCard label="Monthly Sales" value={formatCurrency(monthSales)} tone="green" sub="shipped & delivered" />
        <StatCard
          label="Token Balance"
          value={`${tokens} TK`}
          tone={lowToken ? "danger" : "amber"}
          sub="AI credits"
        />
      </div>

      <div className="space-y-10 lg:space-y-12">
        {/* Desktop: orders table + low stock side-by-side */}
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 space-y-8 lg:space-y-0">
          <section>
            <p className="text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40 mb-4 lg:mb-5">
              Recent Orders
            </p>
            <div className="overflow-hidden rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm lg:text-[15px]">
                <thead className="bg-surface-low dark:bg-white/5 text-xs lg:text-[13px] uppercase tracking-[0.12em] text-mid-grey dark:text-white/50">
                  <tr>
                    <th className="px-5 py-3 text-left font-bold">Order #</th>
                    <th className="px-5 py-3 text-left font-bold">Customer</th>
                    <th className="px-5 py-3 text-left font-bold">Status</th>
                    <th className="px-5 py-3 text-right font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o, index) => {
                    const overdue = o.status === "pending" && isOverdue(o.date);
                    return (
                      <motion.tr
                        key={o.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className={`border-t border-line dark:border-white/10 ${overdue ? "border-l-2 border-l-ink dark:border-l-white/50" : ""}`}
                      >
                        <td className="px-5 py-4">
                           <Link href={`/vendor/orders/${o.id}`} className="font-bold text-ink dark:text-off-white hover:underline">
                             {o.id}
                           </Link>
                           {overdue ? (
                             <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink dark:text-white/60 mt-0.5">
                               Overdue
                             </p>
                           ) : null}
                         </td>
                         <td className="px-5 py-4 font-medium">{o.customer}</td>
                         <td className="px-5 py-4">
                           <OrderStatusBadge status={o.status} />
                         </td>
                         <td className="px-5 py-4 text-right font-bold tabular-nums">
                          {formatCurrency(o.total)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
              {recentOrders.length === 0 ? (
                <EmptyState
                  title="No orders yet"
                  hint="Share your storefront to start selling."
                />
              ) : null}
            </div>
          </section>

          <section>
            <p className="text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40 mb-4 lg:mb-5">
              Low Stock Alerts
            </p>
            <div className="overflow-hidden rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark">
              {lowStock.length === 0 ? (
                <p className="px-5 py-5 text-sm text-mid-grey dark:text-white/50">
                  All products are well stocked.
                </p>
              ) : (
                lowStock.map((p) => (
                  <Link
                    key={p.id}
                    href="/vendor/inventory"
                    className={`flex items-center justify-between border-t border-line dark:border-white/10 px-5 py-5 first:border-t-0 transition-colors hover:bg-surface-low dark:hover:bg-white/[0.02] ${
                      p.stock === 0 ? "bg-ink/[0.02] dark:bg-white/[0.02]" : ""
                    }`}
                  >
                    <span className="text-sm font-bold text-ink dark:text-white/90">{p.name}</span>
                    <span className="flex items-center gap-3">
                      <span
                        className={
                          p.stock === 0
                            ? "text-sm font-bold text-error"
                            : "text-sm font-bold text-ink dark:text-white/70"
                        }
                      >
                        {p.stock} left
                      </span>
                      {p.stock === 0 ? <ProductStatusBadge status="sold_out" /> : null}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        <section>
          <p className="text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40 mb-4 lg:mb-5">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/vendor/products/new"
              className="flex items-center gap-2 rounded-full bg-ink dark:bg-white px-5 py-3 lg:h-btn-d text-sm lg:text-[14px] font-bold uppercase tracking-[0.08em] text-white dark:text-ink hover:opacity-90 transition-opacity"
            >
              <Package className="h-4 w-4" /> New Product
            </Link>
            <Link
              href="/vendor/campaigns/new"
              className="flex items-center gap-2 rounded-full border border-line dark:border-white/15 bg-white dark:bg-surface-dark px-5 py-3 lg:h-btn-d text-sm lg:text-[14px] font-bold uppercase tracking-[0.08em] text-ink dark:text-off-white hover:bg-surface-low dark:hover:bg-white/5 transition-colors"
            >
              <Megaphone className="h-4 w-4" /> Campaign
            </Link>
            <Link
              href="/vendor/tokens"
              className="flex items-center gap-2 rounded-full border border-line dark:border-white/15 bg-white dark:bg-surface-dark px-5 py-3 lg:h-btn-d text-sm lg:text-[14px] font-bold uppercase tracking-[0.08em] text-ink dark:text-off-white hover:bg-surface-low dark:hover:bg-white/5 transition-colors"
            >
              <Coins className="h-4 w-4" /> Top Up Tokens
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
