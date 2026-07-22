// Token Manager - Core token operations

import { db } from "@/lib/db";
import { subscriptions, tokenTransactions, vendors } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { dbTimestamp, toJsonField } from "@/lib/db/utils";
import type { TokenBalance, TokenUsageRequest, TokenUsageResponse } from "./types";
import { LOW_BALANCE_THRESHOLD } from "./types";

export class TokenManager {
  /**
   * Get token balance for a vendor
   */
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

  /**
   * Check if vendor has enough tokens
   */
  static async hasEnoughTokens(
    vendorId: string,
    requiredTokens: number
  ): Promise<boolean> {
    const balance = await this.getBalance(vendorId);
    if (!balance) return false;
    return balance.tokensRemaining >= requiredTokens && balance.status === "active";
  }

  /**
   * Use tokens for a feature
   */
  static async useTokens(request: TokenUsageRequest): Promise<TokenUsageResponse> {
    const { vendorId, featureType, tokensCost, description, metadata } = request;

    // Check balance
    const hasTokens = await this.hasEnoughTokens(vendorId, tokensCost);
    if (!hasTokens) {
      throw new Error("Insufficient tokens or inactive subscription");
    }

    // Get current subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.vendorId, vendorId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    // Update tokens used
    const newTokensUsed = subscription.tokensUsed + tokensCost;
    const newBalance = subscription.tokensTotal - newTokensUsed;

    await db
      .update(subscriptions)
      .set({
        tokensUsed: newTokensUsed,
        updatedAt: dbTimestamp(),
      })
      .where(eq(subscriptions.id, subscription.id));

    // Log transaction
    const [transaction] = await db
      .insert(tokenTransactions)
      .values({
        id: randomUUID(),
        vendorId,
        type: "usage",
        amount: -tokensCost,
        balance: newBalance,
        description: description || `Used ${tokensCost} tokens for ${featureType}`,
        metadata: toJsonField({ featureType, ...metadata }),
      })
      .returning();

    return {
      success: true,
      tokensUsed: tokensCost,
      tokensRemaining: newBalance,
      transactionId: transaction.id,
    };
  }

  /**
   * Add tokens to vendor account (after purchase)
   */
  static async addTokens(
    vendorId: string,
    tokenAmount: number,
    reference: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Check if subscription exists
    const [existingSubscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.vendorId, vendorId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (existingSubscription) {
      // Add tokens to existing subscription
      const newTotal = existingSubscription.tokensTotal + tokenAmount;
      await db
        .update(subscriptions)
        .set({
          tokensTotal: newTotal,
          status: "active",
          updatedAt: dbTimestamp(),
          paymentReference: reference,
        })
        .where(eq(subscriptions.id, existingSubscription.id));

      // Log transaction
      await db.insert(tokenTransactions).values({
        id: randomUUID(),
        vendorId,
        type: "purchase",
        amount: tokenAmount,
        balance: newTotal - existingSubscription.tokensUsed,
        description: `Purchased ${tokenAmount} tokens`,
        reference,
        metadata: toJsonField(metadata ?? null),
      });
    } else {
      // Create new subscription
      const [newSubscription] = await db
        .insert(subscriptions)
        .values({
          id: randomUUID(),
          vendorId,
          tokensTotal: tokenAmount,
          tokensUsed: 0,
          status: "active",
          paymentReference: reference,
        })
        .returning();

      // Log transaction
      await db.insert(tokenTransactions).values({
        id: randomUUID(),
        vendorId,
        type: "purchase",
        amount: tokenAmount,
        balance: tokenAmount,
        description: `Purchased ${tokenAmount} tokens`,
        reference,
        metadata: toJsonField(metadata ?? null),
      });
    }
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(
    vendorId: string,
    limit = 50
  ): Promise<any[]> {
    return await db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.vendorId, vendorId))
      .orderBy(desc(tokenTransactions.createdAt))
      .limit(limit);
  }

  /**
   * Check for low balance and return alert
   */
  static async checkLowBalance(vendorId: string): Promise<boolean> {
    const balance = await this.getBalance(vendorId);
    return balance ? balance.lowBalanceAlert : false;
  }
}
