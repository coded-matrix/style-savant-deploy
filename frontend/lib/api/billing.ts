import { apiJson } from "./client";

/** Backend /api/billing/* — Hubtel mobile-money subscription + token bundles. */

export interface BillingPlan {
  monthlyFeeGhs: number;
  monthlyTokens: number;
  tryonTokenCost: number;
  bundleSizes: number[];
  pricePer1000: number;
}

export interface BillingSubscription {
  status: "active" | "expired" | "cancelled";
  inTrial: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  needsPayment: boolean;
  tokensTotal: number;
  tokensUsed: number;
  tokensRemaining: number;
}

export interface BillingPayment {
  id: string;
  purpose: "subscription" | "tokens";
  amount: string;
  tokensGranted: number;
  clientReference: string;
  status: "pending" | "paid" | "failed";
  checkoutUrl: string | null;
  createdAt: string;
}

export interface BillingSummary {
  plan: BillingPlan;
  subscription: BillingSubscription | null;
  payments: BillingPayment[];
}

export interface CheckoutStart {
  clientReference: string;
  checkoutUrl: string;
  amount: number;
}

export const billingApi = {
  async getSummary(): Promise<BillingSummary> {
    return apiJson<BillingSummary>("/api/backend/billing/billing");
  },

  /** Start the monthly-fee checkout; redirect the vendor to `checkoutUrl`. */
  async subscribe(): Promise<CheckoutStart> {
    return apiJson<CheckoutStart>("/api/backend/billing/subscribe", { method: "POST" });
  },

  /** Start a token-bundle checkout; redirect the vendor to `checkoutUrl`. */
  async buyTokens(bundleSize: number): Promise<CheckoutStart> {
    return apiJson<CheckoutStart>("/api/backend/billing/tokens", {
      method: "POST",
      body: { bundleSize },
    });
  },

  /** Status-check fallback (reconciles with Hubtel server-side). */
  async checkStatus(reference: string): Promise<{ status: string }> {
    return apiJson<{ status: string }>(
      `/api/backend/billing/status/${encodeURIComponent(reference)}`,
    );
  },
};
