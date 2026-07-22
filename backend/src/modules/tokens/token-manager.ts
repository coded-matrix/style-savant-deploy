import { eq, desc } from 'drizzle-orm';
import { db } from '../../config/db';
import { subscriptions, tokenTransactions } from '../../db/schema';
import {
  TokenBalance,
  TokenUsageRequest,
  TokenUsageResponse,
  LOW_BALANCE_THRESHOLD,
} from './token.types';

// Ported from the frontend's TokenManager so token math matches exactly on both sides.
export class TokenManager {
  static async getBalance(vendorId: string): Promise<TokenBalance | null> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.vendorId, vendorId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!subscription) return null;

    const tokensRemaining = subscription.tokensTotal - subscription.tokensUsed;

    return {
      vendorId: subscription.vendorId,
      tokensTotal: subscription.tokensTotal,
      tokensUsed: subscription.tokensUsed,
      tokensRemaining,
      status: subscription.status,
      lowBalanceAlert: tokensRemaining <= LOW_BALANCE_THRESHOLD,
    };
  }

  static async hasEnoughTokens(vendorId: string, requiredTokens: number): Promise<boolean> {
    const balance = await this.getBalance(vendorId);
    if (!balance) return false;
    return balance.tokensRemaining >= requiredTokens && balance.status === 'active';
  }

  static async useTokens(request: TokenUsageRequest): Promise<TokenUsageResponse> {
    const { vendorId, featureType, tokensCost, description, metadata } = request;
    return this.chargeTokens(
      vendorId,
      tokensCost,
      description || `Used ${tokensCost} tokens for ${featureType}`,
      { featureType, ...metadata }
    );
  }

  // Generic deduction used by both enum AI features and campaign generation.
  // Runs in a transaction with a row lock so two concurrent charges can never
  // overspend or lose a deduction. metadata is free-form jsonb, so features
  // outside aiFeatureTypeEnum (like campaigns) still meter cleanly.
  static async chargeTokens(
    vendorId: string,
    tokensCost: number,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<TokenUsageResponse> {
    return db.transaction(async (tx) => {
      const [subscription] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.vendorId, vendorId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1)
        .for('update');

      if (!subscription) throw new Error('No active subscription found');

      const remaining = subscription.tokensTotal - subscription.tokensUsed;
      if (subscription.status !== 'active' || remaining < tokensCost) {
        throw new Error('Insufficient tokens or inactive subscription');
      }

      const newTokensUsed = subscription.tokensUsed + tokensCost;
      const newBalance = subscription.tokensTotal - newTokensUsed;

      await tx
        .update(subscriptions)
        .set({ tokensUsed: newTokensUsed, updatedAt: new Date() })
        .where(eq(subscriptions.id, subscription.id));

      const [transaction] = await tx
        .insert(tokenTransactions)
        .values({
          vendorId,
          type: 'usage',
          amount: -tokensCost,
          balance: newBalance,
          description,
          metadata,
        })
        .returning();

      return {
        success: true,
        tokensUsed: tokensCost,
        tokensRemaining: newBalance,
        transactionId: transaction.id,
      };
    });
  }

  // Gives tokens back when an AI call that was already charged fails partway.
  static async refundTokens(
    vendorId: string,
    amount: number,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await db.transaction(async (tx) => {
      const [subscription] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.vendorId, vendorId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1)
        .for('update');

      if (!subscription) return;

      // Never let a refund push usage below zero
      const newTokensUsed = Math.max(0, subscription.tokensUsed - amount);
      const newBalance = subscription.tokensTotal - newTokensUsed;

      await tx
        .update(subscriptions)
        .set({ tokensUsed: newTokensUsed, updatedAt: new Date() })
        .where(eq(subscriptions.id, subscription.id));

      await tx.insert(tokenTransactions).values({
        vendorId,
        type: 'refund',
        amount,
        balance: newBalance,
        description,
        metadata,
      });
    });
  }

  static async addTokens(
    vendorId: string,
    tokenAmount: number,
    reference: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.vendorId, vendorId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1)
        .for('update');

      if (existing) {
        const newTotal = existing.tokensTotal + tokenAmount;
        await tx
          .update(subscriptions)
          .set({ tokensTotal: newTotal, status: 'active', updatedAt: new Date(), paymentReference: reference })
          .where(eq(subscriptions.id, existing.id));

        await tx.insert(tokenTransactions).values({
          vendorId,
          type: 'purchase',
          amount: tokenAmount,
          balance: newTotal - existing.tokensUsed,
          description: `Purchased ${tokenAmount} tokens`,
          reference,
          metadata,
        });
      } else {
        await tx
          .insert(subscriptions)
          .values({ vendorId, tokensTotal: tokenAmount, tokensUsed: 0, status: 'active', paymentReference: reference });

        await tx.insert(tokenTransactions).values({
          vendorId,
          type: 'purchase',
          amount: tokenAmount,
          balance: tokenAmount,
          description: `Purchased ${tokenAmount} tokens`,
          reference,
          metadata,
        });
      }
    });
  }

  static async getTransactionHistory(vendorId: string, limit = 50) {
    return db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.vendorId, vendorId))
      .orderBy(desc(tokenTransactions.createdAt))
      .limit(limit);
  }
}
