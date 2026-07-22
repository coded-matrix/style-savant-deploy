"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  measurementApi,
  toValues,
  cmToIn,
  inToCm,
  MeasurementField,
} from "@/lib/api/measurement";

type Unit = "in" | "cm";

interface FieldSpec {
  key: MeasurementField;
  label: string;
  /** Shown under the input so a shopper can measure themselves correctly. */
  hint: string;
}

/**
 * Grouped the way a tailor works down the body, so filling the form top to
 * bottom mirrors an actual fitting.
 */
const GROUPS: { title: string; fields: FieldSpec[] }[] = [
  {
    title: "Upper body",
    fields: [
      { key: "chest", label: "Chest", hint: "Around the fullest part of the chest, under the arms." },
      { key: "bust", label: "Bust", hint: "Around the fullest part of the bust." },
      { key: "underbust", label: "Underbust", hint: "Directly under the bust, snug." },
      { key: "shoulderWidth", label: "Shoulder width", hint: "Seam to seam across the back." },
      { key: "neck", label: "Neck", hint: "Around the base of the neck, one finger loose." },
      { key: "sleeveLength", label: "Sleeve length", hint: "Shoulder seam to wrist, arm slightly bent." },
      { key: "bicep", label: "Bicep", hint: "Around the fullest part of the upper arm." },
      { key: "wrist", label: "Wrist", hint: "Around the wrist bone." },
      { key: "backLength", label: "Back length", hint: "Nape of neck down to the natural waist." },
    ],
  },
  {
    title: "Lower body",
    fields: [
      { key: "waist", label: "Waist", hint: "Around the natural waist, the narrowest point." },
      { key: "hips", label: "Hips", hint: "Around the fullest part of the hips and seat." },
      { key: "thigh", label: "Thigh", hint: "Around the fullest part of one thigh." },
      { key: "knee", label: "Knee", hint: "Around the knee, leg straight." },
      { key: "calf", label: "Calf", hint: "Around the fullest part of the calf." },
      { key: "inseam", label: "Inseam", hint: "Crotch down to the ankle, inside the leg." },
      { key: "outseam", label: "Outseam", hint: "Waist down to the ankle, outside the leg." },
    ],
  },
  {
    title: "Full length",
    fields: [
      { key: "height", label: "Height", hint: "Head to floor, standing straight without shoes." },
    ],
  },
];

/**
 * Full tailor measurement sheet. Values are stored in inches; the toggle only
 * changes what the shopper types and reads, converting on the way in and out.
 */
export function MeasurementEditor({
  onSaved,
  onClose,
}: {
  onSaved?: () => void;
  onClose?: () => void;
}) {
  const [unit, setUnit] = useState<Unit>("in");
  // Keep raw text per field so a half-typed "3." doesn't get clobbered.
  const [text, setText] = useState<Partial<Record<MeasurementField, string>>>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Inches are the source of truth; re-render the inputs when the unit flips.
  const [inches, setInches] = useState<Partial<Record<MeasurementField, number>>>({});

  const paint = useCallback((vals: Partial<Record<MeasurementField, number>>, u: Unit) => {
    const next: Partial<Record<MeasurementField, string>> = {};
    for (const [k, v] of Object.entries(vals)) {
      if (v == null) continue;
      const shown = u === "in" ? v : inToCm(v);
      next[k as MeasurementField] = String(Math.round(shown * 100) / 100);
    }
    setText(next);
  }, []);

  useEffect(() => {
    measurementApi
      .getMyMeasurement()
      .then((m) => {
        const vals = toValues(m);
        setInches(vals);
        paint(vals, "in");
        if (m?.notes) setNotes(m.notes);
        if (m?.updatedAt) setSavedAt(m.updatedAt);
      })
      .catch(() => setError("Could not load your measurements."))
      .finally(() => setLoading(false));
  }, [paint]);

  const switchUnit = (u: Unit) => {
    if (u === unit) return;
    // Convert what's currently typed rather than what was last saved.
    const current: Partial<Record<MeasurementField, number>> = { ...inches };
    for (const [k, raw] of Object.entries(text)) {
      const n = Number(raw);
      if (raw !== "" && Number.isFinite(n)) {
        current[k as MeasurementField] = unit === "in" ? n : cmToIn(n);
      }
    }
    setInches(current);
    setUnit(u);
    paint(current, u);
  };

  const filledCount = useMemo(
    () => Object.values(text).filter((v) => v !== "" && v != null).length,
    [text],
  );

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, number | null | string> = {};
      for (const g of GROUPS) {
        for (const f of g.fields) {
          const raw = text[f.key];
          if (raw === undefined) continue;
          if (raw === "") {
            payload[f.key] = null;
            continue;
          }
          const n = Number(raw);
          if (!Number.isFinite(n)) continue;
          // Always persist inches regardless of the display unit.
          payload[f.key] = unit === "in" ? n : cmToIn(n);
        }
      }
      payload.notes = notes.trim() || null;

      const saved = await measurementApi.saveMeasurement(payload as never);
      const vals = toValues(saved);
      setInches(vals);
      paint(vals, unit);
      setSavedAt(saved.updatedAt);
      onSaved?.();
    } catch (err) {
      setError((err as Error).message || "Could not save your measurements.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-mid-grey/30 border-t-ink dark:border-white/20 dark:border-t-white" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Unit toggle + progress */}
      <div className="flex shrink-0 items-center justify-between border-b border-line px-1 pb-3 dark:border-white/10">
        <p className="text-caption text-mid-grey dark:text-white/60">
          {filledCount} of 17 filled
        </p>
        <div
          role="radiogroup"
          aria-label="Measurement unit"
          className="flex items-center rounded-full bg-surface-low p-0.5 dark:bg-white/10"
        >
          {(["in", "cm"] as Unit[]).map((u) => (
            <button
              key={u}
              role="radio"
              aria-checked={unit === u}
              onClick={() => switchUnit(u)}
              className={cn(
                "rounded-full px-4 py-1.5 text-caption font-bold transition-colors",
                unit === u
                  ? "bg-ink text-white dark:bg-white dark:text-ink"
                  : "text-mid-grey dark:text-white/60",
              )}
            >
              {u === "in" ? "Inches" : "cm"}
            </button>
          ))}
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto py-4">
        {GROUPS.map((g) => (
          <section key={g.title} className="mb-6">
            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-mid-grey dark:text-white/50">
              {g.title}
            </h4>
            <div className="space-y-3">
              {g.fields.map((f) => (
                <div key={f.key}>
                  <label
                    htmlFor={`m-${f.key}`}
                    className="mb-1 block text-label-bold text-ink dark:text-off-white"
                  >
                    {f.label}
                  </label>
                  <div className="relative">
                    <input
                      id={`m-${f.key}`}
                      type="number"
                      inputMode="decimal"
                      step="0.25"
                      min="0"
                      value={text[f.key] ?? ""}
                      onChange={(e) =>
                        setText((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                      placeholder="—"
                      className="h-12 w-full rounded-input border-2 border-line bg-white pl-3.5 pr-14 text-body-md text-ink focus:border-ink focus:outline-none dark:border-white/15 dark:bg-surface-dark dark:text-off-white dark:focus:border-white/40"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-caption text-mid-grey dark:text-white/40">
                      {unit === "in" ? "in" : "cm"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-mid-grey dark:text-white/40">
                    {f.hint}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="mb-4">
          <label
            htmlFor="m-notes"
            className="mb-1 block text-label-bold text-ink dark:text-off-white"
          >
            Notes for the tailor
          </label>
          <textarea
            id="m-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. prefers a loose sleeve, left shoulder slightly lower"
            className="w-full resize-none rounded-input border-2 border-line bg-white p-3 text-body-md text-ink focus:border-ink focus:outline-none dark:border-white/15 dark:bg-surface-dark dark:text-off-white dark:focus:border-white/40"
          />
        </section>

        {error ? <p className="mb-3 text-caption text-error">{error}</p> : null}
        {savedAt && !error ? (
          <p className="mb-3 text-caption text-mid-grey dark:text-white/40">
            Last updated {new Date(savedAt).toLocaleDateString()}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-3 border-t border-line pt-3 dark:border-white/10">
        {onClose ? (
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-line py-3 text-body-md font-medium text-ink dark:border-white/15 dark:text-off-white"
          >
            Close
          </button>
        ) : null}
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 rounded-full bg-ink py-3 text-body-md font-medium text-white disabled:opacity-50 dark:bg-white dark:text-ink"
        >
          {saving ? "Saving…" : "Save measurements"}
        </button>
      </div>
    </div>
  );
}
