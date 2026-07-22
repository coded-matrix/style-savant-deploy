// Token System Types

export interface TokenBalance {
  vendorId: string;
  tokensTotal: number;
  tokensUsed: number;
  tokensRemaining: number;
  status: "active" | "expired" | "cancelled";
  lowBalanceAlert: boolean;
}

export interface TokenTransaction {
  id: string;
  vendorId: string;
  type: "purchase" | "usage" | "refund";
  amount: number;
  balance: number;
  description?: string;
  reference?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface TokenPurchaseRequest {
  vendorId: string;
  tokenAmount: number;
  amountGHS: number;
  email: string;
  metadata?: Record<string, any>;
}

export interface TokenPurchaseResponse {
  success: boolean;
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}

export interface TokenUsageRequest {
  vendorId: string;
  featureType: "inventory_analysis" | "background_removal" | "demand_forecast";
  tokensCost: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TokenUsageResponse {
  success: boolean;
  tokensUsed: number;
  tokensRemaining: number;
  transactionId: string;
}

export const TOKEN_BUNDLES = [
  { tokens: 1000, priceGHS: 75, bonus: 0 },
  { tokens: 5000, priceGHS: 350, bonus: 250 }, // 5% bonus
  { tokens: 10000, priceGHS: 650, bonus: 500 }, // 7.5% bonus
] as const;

export type TokenBundle = (typeof TOKEN_BUNDLES)[number];

export const TOKEN_COSTS = {
  INVENTORY_ANALYSIS: 10,
  BACKGROUND_REMOVAL: 5,
  DEMAND_FORECAST: 15,
  SMART_MEASUREMENT: 0, // Free feature
} as const;

export const LOW_BALANCE_THRESHOLD = 100;
