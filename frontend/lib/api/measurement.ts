import { apiJson } from "./client";

export interface MeasurementInput {
  chest?: number;
  waist?: number;
  hips?: number;
  shoulderWidth?: number;
  inseam?: number;
  height?: number;
  recommendedSize?: string | null;
  confidencePercent?: number;
  rawLandmarks?: any;
}

export interface MeasurementResult {
  id: string;
  userId: string;
  chestInches: string | null;
  waistInches: string | null;
  hipsInches: string | null;
  sleeveLengthInches: string | null;
  inseamInches: string | null;
  heightInches: string | null;
  recommendedSize: string | null;
  confidencePercent: number | null;
  createdAt: string;
}

export interface RecommendSizeResult {
  recommendedSize: string | null;
  confidencePercent: number;
  fit: string;
  alternatives?: { size: string; confidence: number; note: string }[];
  note?: string;
}

export const measurementApi = {
  async saveMeasurement(input: MeasurementInput): Promise<MeasurementResult> {
    return apiJson<MeasurementResult>("/api/backend/measurements", {
      method: "POST",
      body: input,
    });
  },

  async getMyMeasurement(): Promise<MeasurementResult | null> {
    return apiJson<MeasurementResult | null>("/api/backend/measurements/me");
  },

  async recommendSize(productId: string): Promise<RecommendSizeResult> {
    return apiJson<RecommendSizeResult>(`/api/backend/measurements/recommend?productId=${productId}`);
  },
};
