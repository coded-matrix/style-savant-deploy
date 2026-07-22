import { apiJson } from "./client";

/**
 * Tailor-grade body measurements. The API speaks INCHES only; the UI converts
 * for display via the cm toggle so there is never a stored-unit ambiguity.
 */

/** Field keys accepted by the API, in inches. */
export const MEASUREMENT_FIELDS = [
  "chest", "bust", "underbust", "shoulderWidth", "neck", "sleeveLength",
  "bicep", "wrist", "backLength",
  "waist", "hips", "thigh", "knee", "calf", "inseam", "outseam",
  "height",
] as const;

export type MeasurementField = (typeof MEASUREMENT_FIELDS)[number];

export type MeasurementInput = Partial<Record<MeasurementField, number | null>> & {
  notes?: string | null;
  recommendedSize?: string | null;
  confidencePercent?: number;
  rawLandmarks?: unknown;
};

/** Raw API shape — decimals arrive as strings from Postgres. */
export interface MeasurementResult {
  id: string;
  userId: string;
  chestInches: string | null;
  bustInches: string | null;
  underbustInches: string | null;
  shoulderWidthInches: string | null;
  neckInches: string | null;
  sleeveLengthInches: string | null;
  bicepInches: string | null;
  wristInches: string | null;
  backLengthInches: string | null;
  waistInches: string | null;
  hipsInches: string | null;
  thighInches: string | null;
  kneeInches: string | null;
  calfInches: string | null;
  inseamInches: string | null;
  outseamInches: string | null;
  heightInches: string | null;
  notes: string | null;
  recommendedSize: string | null;
  confidencePercent: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendSizeResult {
  recommendedSize: string | null;
  confidencePercent: number;
  fit: string;
  alternatives?: { size: string; confidence: number; note: string }[];
  note?: string;
}

/** Flatten the `*Inches` API shape into plain numbers keyed by field. */
export function toValues(
  m: MeasurementResult | null,
): Partial<Record<MeasurementField, number>> {
  if (!m) return {};
  const out: Partial<Record<MeasurementField, number>> = {};
  for (const f of MEASUREMENT_FIELDS) {
    const raw = (m as unknown as Record<string, string | null>)[`${f}Inches`];
    if (raw != null && raw !== "") {
      const n = Number(raw);
      if (Number.isFinite(n)) out[f] = n;
    }
  }
  return out;
}

export const CM_PER_IN = 2.54;
export const inToCm = (inches: number) => inches * CM_PER_IN;
export const cmToIn = (cm: number) => cm / CM_PER_IN;

function round(n: number, dp: number) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/** Display a stored inch value in the chosen unit, sensibly rounded. */
export function formatMeasure(
  inches: number | undefined,
  unit: "in" | "cm",
): string {
  if (inches == null) return "—";
  return unit === "in" ? `${round(inches, 2)}"` : `${round(inToCm(inches), 1)} cm`;
}

export const measurementApi = {
  /** Upsert — partial patches are safe; omitted fields keep their value. */
  async saveMeasurement(input: MeasurementInput): Promise<MeasurementResult> {
    return apiJson<MeasurementResult>("/api/backend/measurements", {
      method: "PUT",
      body: input,
    });
  },

  async getMyMeasurement(): Promise<MeasurementResult | null> {
    return apiJson<MeasurementResult | null>("/api/backend/measurements/me");
  },

  async recommendSize(productId: string): Promise<RecommendSizeResult> {
    return apiJson<RecommendSizeResult>(
      `/api/backend/measurements/recommend?productId=${productId}`,
    );
  },
};
