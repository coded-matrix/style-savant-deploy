// Mirrors the frontend's token system so balances and costs line up

export interface TokenBalance {
  vendorId: string;
  tokensTotal: number;
  tokensUsed: number;
  tokensRemaining: number;
  status: 'active' | 'expired' | 'cancelled';
  lowBalanceAlert: boolean;
}

export interface TokenUsageRequest {
  vendorId: string;
  featureType: 'inventory_analysis' | 'background_removal' | 'demand_forecast';
  tokensCost: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface TokenUsageResponse {
  success: boolean;
  tokensUsed: number;
  tokensRemaining: number;
  transactionId: string;
}

import { config } from '../../config/env';

export const TOKEN_COSTS = {
  BACKGROUND_REMOVAL: config.tokens.backgroundRemovalCost,
  CAMPAIGN_COPY: config.tokens.campaignCopyCost,
  CAMPAIGN_IMAGE: config.tokens.campaignImageCost,
} as const;

export const LOW_BALANCE_THRESHOLD = config.tokens.lowBalanceThreshold;
