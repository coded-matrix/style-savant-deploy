"use client";

import { useMemo, useState } from "react";
import { useVendor } from "@/context/VendorContext";
import { PageHeader, Chip, StatCard, EmptyState } from "@/components/vendor/shared";
import { formatCurrency } from "@/lib/utils";

const RANGES = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "all", label: "All time" },
];

export default function AnalyticsPage() {
  const { orders, tokens, tokenUsage } = useVendor();
  const [range, setRange] = useState("30d");

  const spent = tokenUsage.reduce((s, u) => s + u.tokens, 0);
  const tryOnCalls = tokenUsage.find((u) => u.feature === "Virtual Try-On")?.calls ?? 0;
  const aiOrders = orders.filter(
    (o) => o.bespoke || o.status === "delivered",
  ).length;
  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + o.total, 0);
  const roi = spent > 0 ? Math.round((totalRevenue / (spent * 0.75)) * 10) / 10 : 0;

  const bars = useMemo(() => {
    const n = range === "7d" ? 7 : range === "90d" ? 90 : range === "all" ? 180 : 30;
    const d = Array.from({ length: n }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (n - 1 - i));
      const label = date.toLocaleDateString("en-GH", { month: "short", day: "numeric" });
      const rev = orders
        .filter((o) => o.status === "delivered")
        .filter((o) => {
          const od = new Date(o.date);
          return od.toDateString() === date.toDateString();
        })
        .reduce((s, o) => s + o.total, 0);
      return { label, rev };
    });
    return d;
  }, [range, orders]);

  const maxRev = Math.max(...bars.map((b) => b.rev), 1);

  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const conversion = deliveredCount > 0 ? Math.round((deliveredCount / orders.length) * 100) : 0;
  const avgOrder = deliveredCount > 0 ? Math.round(totalRevenue / deliveredCount) : 0;

  return (
    <div>
      <PageHeader title="Analytics" subtitle={`Stats for the selected period`} />

      <div className="space-y-5 lg:space-y-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {RANGES.map((r) => (
            <Chip key={r.key} active={range === r.key} onClick={() => setRange(r.key)}>
              {r.label}
            </Chip>
          ))}
        </div>

        {/* Desktop: chart + stats side-by-side */}
        <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-6 space-y-5 lg:space-y-0">
          <div className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-5">
            <h3 className="mb-4 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Revenue</h3>
            <div className="flex items-end gap-1" style={{ height: 140 }}>
              {bars.map((b, i) => (
                <div key={i} className="group relative flex-1">
                  <div
                    className="w-full rounded-t bg-teal transition hover:bg-vendor-container"
                    style={{ height: `${Math.max(4, (b.rev / maxRev) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-right text-v-tsm font-bold text-teal dark:text-off-white">
              {formatCurrency(totalRevenue)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Orders" value={orders.length} tone="teal" />
            <StatCard label="Conversion Rate" value={`${conversion}%`} tone="green" />
            <StatCard label="Avg Order Value" value={formatCurrency(avgOrder)} tone="teal" />
            <StatCard label="Try-On Activations" value={tryOnCalls} tone="coral" />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-5">
          <h3 className="text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Token ROI</h3>
          <p className="text-v-body text-vendor-text-grey">
            {spent} tokens spent = GHS {formatCurrency(spent * 0.75)} cost
          </p>
          <p className="mt-1 text-v-tsm font-bold text-vendor-success">
            Revenue from AI-assisted sales: {formatCurrency(totalRevenue)} (ROI {roi}x)
          </p>
          {aiOrders === 0 ? (
            <p className="mt-2 text-v-meta text-vendor-text-grey">
              No AI-assisted sales yet. Use Campaign Creation or enable Try-On on your
              listings to track ROI.
            </p>
          ) : null}
        </div>

        <section>
          <h3 className="mb-3 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Campaign Performance</h3>
          <EmptyState
            title="No campaign data yet"
            hint="Generate a campaign to see performance metrics."
          />
        </section>

        <p className="text-right text-v-meta text-vendor-text-grey">
          Last updated: {new Date().toLocaleTimeString("en-GH")}
        </p>
      </div>
    </div>
  );
}
