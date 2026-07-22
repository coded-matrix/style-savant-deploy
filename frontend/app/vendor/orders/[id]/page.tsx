"use client";

import Link from "next/link";
import { use, useState } from "react";
import { Check, Printer, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVendor } from "@/context/VendorContext";
import { PageHeader, Thumb, EmptyState } from "@/components/vendor/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/lib/vendor/types";

const STAGES: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];
const STAGE_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  packed: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
};
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "packed",
  packed: "shipped",
  shipped: "delivered",
};
const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Mark as Confirmed",
  confirmed: "Mark as Packed",
  packed: "Mark as Shipped",
  shipped: "Mark as Delivered",
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = use(params);
  const { orders, updateOrder, toast } = useVendor();
  const order = orders.find((o) => o.id === resolved.id);
  const [tracking, setTracking] = useState(order?.tracking ?? "");
  const [courier, setCourier] = useState(order?.courier ?? "");
  const [saved, setSaved] = useState(false);

  if (!order) {
    return (
        <EmptyState
          title="Order not found"
          action={
            <Link href="/vendor/orders" className="text-teal dark:text-off-white">
              Back to Orders
            </Link>
          }
        />
    );
  }

  const stageIdx = STAGE_INDEX[order.status];
  const itemTotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const fee = Math.round(itemTotal * 0.08);
  const net = itemTotal - fee;

  const trackingValid = /^[A-Za-z0-9]{13}$/.test(tracking);

  const advance = () => {
    const next = NEXT[order.status];
    if (!next) return;
    if (next === "shipped" && !order.tracking) {
      toast("Add a tracking number before marking as shipped.", "error");
      return;
    }
    updateOrder(order.id, { status: next });
    toast(`Order ${next}.`, "success");
  };

  const saveTracking = () => {
    if (!trackingValid) {
      toast("Tracking number must be 13 alphanumeric characters.", "error");
      return;
    }
    updateOrder(order.id, { tracking, courier });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div>
      <PageHeader
        title={order.id}
        subtitle={`${order.customer} · ${formatDate(order.date)}`}
        backHref="/vendor/orders"
      />

      <div className="space-y-6 lg:space-y-8">
        {order.status === "cancelled" ? (
          <div className="rounded-xl border border-vendor-danger/30 bg-vendor-red-tint p-4 text-v-body text-vendor-danger">
            This order was cancelled. Read-only view.
          </div>
        ) : (
          <>
            {/* Timeline */}
            <div className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-5 lg:p-7">
              <div className="flex items-center">
                {STAGES.map((s, i) => {
                  const done = i <= stageIdx;
                  const current = i === stageIdx;
                  return (
                    <div key={s.key} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-v-meta font-bold",
                            done ? "bg-teal text-white" : "bg-line dark:bg-white/10 text-mid-grey",
                            current ? "ring-4 ring-teal/30" : "",
                          )}
                        >
                          {done ? <Check className="h-3 w-3" /> : i + 1}
                        </span>
                        <span className="mt-1 text-v-meta text-vendor-text-grey">{s.label}</span>
                      </div>
                      {i < STAGES.length - 1 ? (
                        <div
                          className={cn(
                            "mx-1 h-0.5 flex-1",
                            i < stageIdx ? "bg-teal" : "bg-line dark:bg-white/15",
                          )}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next action */}
            {NEXT[order.status] ? (
              <button
                onClick={advance}
                className={cn(
                  "w-full rounded-full py-3 lg:h-btn-d text-v-tsm font-bold text-white",
                  order.status === "shipped"
                    ? "bg-vendor-success"
                    : order.status === "packed"
                      ? "bg-vendor-coral-bright"
                      : "bg-teal",
                )}
              >
                {NEXT_LABEL[order.status]}
              </button>
            ) : null}
          </>
        )}

        {/* Customer */}
        <section className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-4 lg:p-6">
          <h2 className="mb-2 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Customer</h2>
          <p className="text-v-body text-ink dark:text-white/90">{order.customer}</p>
          <p className="text-v-body text-vendor-text-grey">{order.phone}</p>
          <p className="text-v-body text-vendor-text-grey">{order.address}</p>
          {order.gps ? (
            <p className="text-v-meta text-vendor-text-grey">GPS: {order.gps}</p>
          ) : null}
        </section>

        {/* Items */}
        <section className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-4 lg:p-6">
          <h2 className="mb-2 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Items</h2>
          <div className="space-y-2">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center gap-3 border-t border-line dark:border-white/10 py-2 first:border-t-0">
                <Thumb name={it.name} className="h-12 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-v-body font-bold text-ink dark:text-white/90">{it.name}</p>
                  <p className="text-v-meta text-vendor-text-grey">
                    {it.size} · {it.color} · ×{it.qty}
                  </p>
                </div>
                <span className="text-v-body font-bold">
                  {formatCurrency(it.price * it.qty)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Measurements */}
        {order.bespoke && order.measurements ? (
          <section
            id="print-measurements"
            className="rounded-xl border border-teal/40 bg-vendor-teal-tint p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Buyer Measurements</h2>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 rounded-full bg-teal px-2.5 py-1 text-v-meta font-bold text-white"
              >
                <Printer className="h-3 w-3" /> Print / Export
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:gap-4">
              {(
                [
                  ["Chest", order.measurements.chest],
                  ["Waist", order.measurements.waist],
                  ["Hips", order.measurements.hips],
                  ["Height", order.measurements.height],
                  ["Shoulder", order.measurements.shoulder],
                  ["Sleeve", order.measurements.sleeve],
                ] as [string, number][]
              ).map(([k, v]) => (
                <div key={k} className="rounded-md bg-white dark:border-white/10 dark:bg-surface-dark p-2">
                   <p className="text-v-meta text-vendor-text-grey dark:text-white/90">{k}</p>
                   <p className="text-v-body font-bold text-ink dark:text-white/90">{v} cm</p>
                 </div>
              ))}
            </div>
            {order.measurements.note ? (
              <p className="mt-2 text-v-body text-vendor-amber dark:text-white/90">
                Note: {order.measurements.note}
              </p>
            ) : null}
            <p className="mt-2 text-v-meta text-vendor-text-grey dark:text-white/90">
              Estimated measurements from MediaPipe scan.
            </p>
          </section>
        ) : null}

        {/* Tracking */}
        <section className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-4 lg:p-6">
          <h2 className="mb-2 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Shipping & Tracking</h2>
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value.toUpperCase())}
            placeholder="EA123456789GH"
            className={cn(
              "vendor-input",
              tracking && !trackingValid ? "border-vendor-danger" : "",
              tracking && trackingValid ? "border-vendor-success" : "",
            )}
          />
          {tracking && (trackingValid ? (
            <p className="mt-1 flex items-center gap-1 text-v-meta text-vendor-success">
              <Check className="h-3 w-3" /> Valid format
            </p>
          ) : (
            <p className="mt-1 flex items-center gap-1 text-v-meta text-vendor-danger">
              <AlertTriangle className="h-3 w-3" /> Must be 13 alphanumeric characters
            </p>
          ))}
          <input
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            placeholder="Courier name (optional)"
            className="vendor-input mt-2"
          />
          <button
            onClick={saveTracking}
            className="mt-2 w-full rounded-full bg-teal py-2.5 lg:h-btn-d text-v-tsm font-bold text-white"
          >
            {saved ? "Saved!" : "Save Tracking Number"}
          </button>
        </section>

        {/* Payment summary */}
        <section className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-4 lg:p-6">
          <h2 className="mb-2 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Payment Summary</h2>
          <Row label="Item total" value={formatCurrency(itemTotal)} />
          <Row label="Style Savant fee (8%)" value={`- ${formatCurrency(fee)}`} />
          <div className="my-2 h-px bg-line dark:bg-white/15" />
          <Row label="Net payout" value={formatCurrency(net)} bold />
        </section>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-v-body text-vendor-text-grey">{label}</span>
      <span className={cn("text-v-body", bold ? "font-bold text-teal dark:text-off-white" : "text-ink dark:text-white/90")}>
        {value}
      </span>
    </div>
  );
}
