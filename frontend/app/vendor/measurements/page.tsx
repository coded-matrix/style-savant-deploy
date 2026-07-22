"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Printer, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVendor } from "@/context/VendorContext";
import { PageHeader, EmptyState } from "@/components/vendor/shared";
import { formatDate } from "@/lib/utils";
import { inToCm } from "@/lib/api/measurement";
import type { Measurements } from "@/lib/vendor/types";

type MeasurementUnit = "in" | "cm";

function convertedMeasurement(valueInches: number, unit: MeasurementUnit) {
  const converted = unit === "cm" ? inToCm(valueInches) : valueInches;
  return Math.round(converted * 100) / 100;
}

const MEASUREMENT_ROWS: [string, keyof Measurements][] = [
  ["Chest", "chest"], ["Bust", "bust"], ["Underbust", "underbust"],
  ["Shoulder width", "shoulderWidth"], ["Neck", "neck"],
  ["Sleeve length", "sleeveLength"], ["Bicep", "bicep"],
  ["Wrist", "wrist"], ["Back length", "backLength"],
  ["Waist", "waist"], ["Hips", "hips"], ["Thigh", "thigh"],
  ["Knee", "knee"], ["Calf", "calf"], ["Inseam", "inseam"],
  ["Outseam", "outseam"], ["Height", "height"],
];

export default function MeasurementsPage() {
  const { orders } = useVendor();
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState<MeasurementUnit>("in");

  const bespoke = useMemo(
    () =>
      orders
        .filter((o) => o.bespoke && o.measurements)
        .filter((o) =>
          query
            ? `${o.id} ${o.customer}`.toLowerCase().includes(query.toLowerCase())
            : true,
        )
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [orders, query],
  );

  const exportCsv = () => {
    const unitLabel = unit === "in" ? "in" : "cm";
    const measurementHeaders = MEASUREMENT_ROWS.map(([label]) => `${label} (${unitLabel})`);
    const header = ["Order #", "Customer", "Date", ...measurementHeaders, "Note"].join(",");
    const rows = bespoke.map(
      (o) => {
        const m = o.measurements!;
        const values = MEASUREMENT_ROWS.map(([, key]) => {
          const value = m[key];
          return typeof value === "number" ? convertedMeasurement(value, unit) : "";
        });
        return [o.id, o.customer, o.date, ...values, `"${m.note ?? ""}"`].join(",");
      },
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "measurements.csv";
    a.click();
  };

  return (
    <div>
      <PageHeader
        title="Measurements"
        subtitle="Smart scan data from buyer orders"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div
              role="radiogroup"
              aria-label="Display measurement unit"
              className="flex min-h-11 items-center rounded-full border border-line bg-white p-1 dark:border-white/10 dark:bg-surface-dark"
            >
              {(["in", "cm"] as MeasurementUnit[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={unit === option}
                  onClick={() => setUnit(option)}
                  className={cn(
                    "min-h-9 rounded-full px-4 text-v-body font-bold transition-colors",
                    unit === option
                      ? "bg-ink text-white dark:bg-white dark:text-ink"
                      : "text-vendor-text-grey",
                  )}
                >
                  {option === "in" ? "Inches" : "cm"}
                </button>
              ))}
            </div>
            <button
              onClick={exportCsv}
              className="flex min-h-11 items-center gap-1 rounded-full bg-teal px-5 py-3 lg:h-btn-d text-v-body font-bold text-white"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        }
      />

      <div className="space-y-6 lg:space-y-8">
        <div className="rounded-xl bg-ink/[0.03] dark:bg-white/[0.03] border border-line dark:border-white/10 px-4 py-3 text-v-body text-ink dark:text-white/90">
          Only visible for orders on made-to-measure or bespoke-flagged listings.
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order # or customer…"
          className="vendor-input rounded-full"
        />

        {bespoke.length === 0 ? (
          <EmptyState
            title="No tailor orders yet"
            hint="Mark a product as made-to-measure in Products to start collecting measurements."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark">
            {bespoke.map((o) => {
              const isOpen = open === o.id;
              const m = o.measurements!;
              return (
                <div key={o.id} className="border-t border-line dark:border-white/10 first:border-t-0">
                  <button
                    onClick={() => setOpen(isOpen ? null : o.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-surface-low dark:hover:bg-white/[0.02]"
                  >
                    <div>
                      <p className="text-v-body font-bold text-teal dark:text-off-white">{o.id}</p>
                      <p className="text-v-meta text-vendor-text-grey">{o.customer}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-v-body text-ink dark:text-white/90">
                        {[m.chest, m.waist, m.hips]
                          .filter((value): value is number => typeof value === "number")
                          .map((value) => convertedMeasurement(value, unit))
                          .join(" · ")} {unit}
                      </span>
                      <ChevronDown
                        className={cn("h-4 w-4 text-mid-grey transition-transform", isOpen && "rotate-180")}
                      />
                    </div>
                  </button>
                  {isOpen ? (
                    <div id="print-measurements" className="border-t border-line dark:border-white/10 bg-vendor-teal-tint p-5">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="grid flex-1 grid-cols-3 gap-2 lg:gap-4">
                          {MEASUREMENT_ROWS.flatMap(([label, key]) => {
                            const value = m[key];
                            return typeof value === "number" ? [[label, value] as const] : [];
                          }).map(([k, v]) => (
                            <div key={k} className="rounded-xl bg-white dark:border-white/10 dark:bg-surface-dark p-5">
                              <p className="text-v-meta text-vendor-text-grey">{k}</p>
                              <p className="text-v-body font-bold text-ink dark:text-white/90">
                                {convertedMeasurement(v, unit)} {unit}
                              </p>
                            </div>
                          ))}
                        </div>
                          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-teal/40 bg-white dark:border-white/10 dark:bg-surface-dark p-5">
                          <BodyDiagram />
                          <p className="mt-1 text-v-meta text-vendor-text-grey">
                            MediaPipe scan
                          </p>
                        </div>
                      </div>
                      {m.note ? (
                        <p className="mt-3 text-v-body text-vendor-amber">Note: {m.note}</p>
                      ) : null}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => window.print()}
                           className="flex items-center gap-1.5 rounded-full border border-line bg-white dark:border-white/10 dark:bg-surface-dark px-5 py-3 text-v-body font-bold text-ink dark:text-white/90 hover:bg-surface-low dark:hover:bg-white/5 transition-colors"
                        >
                          <Printer className="h-4 w-4" /> Print This Order
                        </button>
                        <span className="text-v-meta text-vendor-text-grey self-center">
                          {formatDate(o.date)}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BodyDiagram() {
  return (
    <svg width="60" height="100" viewBox="0 0 60 100" fill="none" className="text-ink dark:text-white/70">
      <circle cx="30" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <line x1="30" y1="20" x2="30" y2="62" stroke="currentColor" strokeWidth="2" />
      <line x1="14" y1="34" x2="46" y2="34" stroke="currentColor" strokeWidth="2" />
      <line x1="30" y1="62" x2="20" y2="92" stroke="currentColor" strokeWidth="2" />
      <line x1="30" y1="62" x2="40" y2="92" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
