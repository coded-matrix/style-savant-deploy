"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORECAST_COST } from "@/lib/vendor/constants";
import { useVendor } from "@/context/VendorContext";
import { PageHeader, Chip, ProductStatusBadge, EmptyState, Thumb } from "@/components/vendor/shared";
import { formatCurrency } from "@/lib/utils";

export default function InventoryPage() {
  const { products, orders, updateStock, requestSpend, recordUsage, toast } = useVendor();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "sold" | string>("all");
  const [analyzing, setAnalyzing] = useState(false);
  const [forecast, setForecast] = useState<{
    ran: boolean;
    cost: number;
    recommendations: string[];
  } | null>(null);

  const active = products.filter((p) => p.status !== "archived");
  const inStock = active.filter((p) => p.stock > 3).length;
  const lowStock = active.filter((p) => p.stock > 0 && p.stock <= 3).length;
  const soldOut = active.filter((p) => p.stock === 0).length;

  const filtered = active
    .filter((p) => {
      if (filter === "low") return p.stock > 0 && p.stock <= 3;
      if (filter === "sold") return p.stock === 0;
      return true;
    })
    .filter((p) =>
      query ? `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()) : true,
    );

  const runAnalysis = () => {
    setAnalyzing(true);
    requestSpend(
      FORECAST_COST,
      () => {
        const orderCount = orders.length;
        const recs: string[] =
          orderCount < 5
            ? ["Not enough order history for forecasting yet. Check back after your first 5 orders."]
            : [
                "Restock Ankara Wrap Dress (AD-014) ahead of Q3 — demand trending up 32%.",
                "Low stock on Kente Sneakers (KS-019) — reorder by end of week.",
                "Overstock: Beaded Necklace Set (BN-011) — consider promotional pricing.",
                "Seasonal forecast: smock demand peaks Nov–Jan. Plan inventory by October.",
              ];
        setTimeout(() => {
          setAnalyzing(false);
          setForecast({ ran: true, cost: FORECAST_COST, recommendations: recs });
          recordUsage("AI Inventory Forecast", FORECAST_COST);
          toast(`Analysis complete — ${FORECAST_COST} tokens used.`, "success");
        }, 2500);
      },
      "AI Inventory Forecast",
    );
  };

  const exportCsv = () => {
    const header = "Name,SKU,Stock,Status,Sizes";
    const rows = active.map(
      (p) => `"${p.name}",${p.sku},${p.stock},${p.status},"${p.sizes.join(" ")}"`,
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "inventory.csv";
    a.click();
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Stock levels across all active listings"
        action={
          <button
            onClick={exportCsv}
            className="flex items-center gap-1 rounded-full bg-teal px-5 py-3 lg:h-btn-d text-v-body font-bold text-white"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      <div className="space-y-6 lg:space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
          <MiniStat label="SKUs" value={active.length} />
          <MiniStat label="In Stock" value={inStock} tone="green" />
          <MiniStat label="Low ≤3" value={lowStock} tone="amber" />
          <MiniStat label="Sold Out" value={soldOut} tone="danger" />
        </div>

        {/* Desktop: inventory table + AI forecast side-by-side */}
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6 space-y-5 lg:space-y-0">
          <div>
            <div className="flex gap-3 mb-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products or SKU…"
                className="vendor-input rounded-full"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
              {(["all", "low", "sold"] as const).map((f) => (
                <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                  {f === "all" ? "All" : f === "low" ? "Low Stock" : "Sold Out"}
                </Chip>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark">
              {filtered.length === 0 ? (
                <EmptyState title="No products match" />
              ) : (
                filtered.map((p) => (
                  <div
                    key={p.id}
                      className={cn(
                        "flex items-center gap-3 border-t border-line dark:border-white/10 px-4 py-3 first:border-t-0 transition-colors hover:bg-surface-low dark:hover:bg-white/[0.02]",
                      p.stock === 0 ? "bg-vendor-red-tint" : "",
                    )}
                  >
                    <Thumb name={p.name} className="h-10 w-9 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-v-body font-bold text-ink dark:text-white/90">{p.name}</p>
                      <p className="text-v-meta text-vendor-text-grey">{p.sku}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {p.sizes.map((s) => (
                        <span
                          key={s}
                          className={cn(
                            "rounded-md border px-1.5 py-0.5 text-v-meta",
                            p.stock === 0
                              ? "border-vendor-danger/30 text-vendor-danger"
                              : "border-line dark:border-white/10 text-ink dark:text-white/90",
                          )}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => updateStock(p.id, p.stock - 1)}
                        disabled={p.stock === 0}
                        aria-label={`Decrease stock for ${p.name}`}
                        className="grid h-7 w-7 place-items-center rounded-md border border-line dark:border-white/10 text-ink dark:text-white/90 disabled:opacity-30"
                      >
                        −
                      </button>
                      <input
                        value={p.stock}
                        inputMode="numeric"
                        aria-label={`Stock for ${p.name}`}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          updateStock(p.id, v === "" ? 0 : parseInt(v, 10));
                        }}
                        className={cn(
                          "w-10 rounded-md border border-line bg-white px-1 py-0.5 text-center text-v-body font-bold dark:border-white/10 dark:bg-surface-dark",
                          p.stock === 0
                            ? "text-vendor-danger"
                            : p.stock <= 3
                              ? "text-vendor-amber"
                              : "text-ink dark:text-white/90",
                        )}
                      />
                      <button
                        onClick={() => updateStock(p.id, p.stock + 1)}
                        aria-label={`Increase stock for ${p.name}`}
                        className="grid h-7 w-7 place-items-center rounded-md border border-line dark:border-white/10 text-ink dark:text-white/90"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl bg-ink/[0.03] dark:bg-white/[0.03] border border-line dark:border-white/10 px-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-v-body text-ink dark:text-white/90">
                  <span className="font-bold">AI Inventory Optimisation</span> — Run demand
                  forecast and get restock recommendations. Costs {FORECAST_COST} tokens.
                </p>
                <button
                  onClick={runAnalysis}
                  disabled={analyzing}
                  className="flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-v-tsm font-bold text-white disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0 ml-4"
                >
                  {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
                  Run Analysis
                </button>
              </div>
            </div>

            {forecast ? (
              <div className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-5">
                <h2 className="text-v-tsm font-bold text-ink dark:text-white/90">AI Forecast Results</h2>
                <p className="text-v-meta text-vendor-text-grey">
                  Ran just now · {forecast.cost} tokens used
                </p>
                <ul className="mt-3 space-y-2">
                  {forecast.recommendations.map((r, i) => (
                    <li
                      key={i}
                      className={cn("text-v-body", {
                        "text-vendor-success": r.toLowerCase().includes("restock"),
                        "text-vendor-amber": r.toLowerCase().includes("overstock"),
                        "text-teal dark:text-off-white": r.toLowerCase().includes("forecast"),
                        "text-vendor-text-grey": r.toLowerCase().includes("not enough"),
                      })}
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "teal",
}: {
  label: string;
  value: number;
  tone?: "teal" | "green" | "amber" | "danger";
}) {
  const toneCls = {
    teal: "text-teal dark:text-off-white",
    green: "text-vendor-success",
    amber: "text-vendor-amber",
    danger: "text-vendor-danger",
  }[tone];
  return (
    <div className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-4 lg:p-5 text-center transition-shadow hover:shadow-md hover:shadow-ink/5 dark:hover:shadow-black/20">
      <p className={cn("text-v-hmd lg:text-v-hlg font-bold", toneCls)}>{value}</p>
      <p className="text-v-meta text-vendor-text-grey">{label}</p>
    </div>
  );
}
