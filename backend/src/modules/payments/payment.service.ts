import crypto from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../config/db';
import { payments, subscriptions } from '../../db/schema';
import { config } from '../../config/env';
import { TokenManager } from '../tokens/token-manager';
import { initiateCheckout, checkStatus } from './hubtel';

/** Reference prefixes, mirroring coded_matrix's TP/TPAY scheme. */
const REF_SUBSCRIPTION = 'SUB';
const REF_TOKENS = 'TOK';

function makeReference(prefix: string): string {
  // Hubtel caps ClientReference at 36 chars and it must be unique per txn.
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 28)}`;
}

/**
 * Start every new vendor on a free trial month with the full monthly token
 * allocation. Idempotent — does nothing if the vendor already has a
 * subscription row.
 */
export async function ensureTrialSubscription(vendorId: string): Promise<void> {
  const [existing] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.vendorId, vendorId))
    .limit(1);
  if (existing) return;

  const trialEndsAt = new Date(Date.now() + config.billing.trialDays * 24 * 60 * 60 * 1000);
  await db.insert(subscriptions).values({
    vendorId,
    tokensTotal: config.billing.monthlyTokens,
    tokensUsed: 0,
    status: 'active',
    trialEndsAt,
    currentPeriodEnd: trialEndsAt,
  });
}

/**
 * Create a pending payment and a Hubtel checkout for the flat monthly fee.
 * The vendor pays manually each month (no auto-recurring for now).
 */
export async function startSubscriptionPayment(vendorId: string) {
  const amount = config.billing.monthlyFeeGhs;
  const clientReference = makeReference(REF_SUBSCRIPTION);
  const frontend = config.cors.allowedOrigins[0] ?? 'http://localhost:3000';

  const checkout = await initiateCheckout({
    amountGhs: amount,
    description: 'Style Savant vendor subscription (1 month)',
    clientReference,
    callbackUrl: `${config.storage.publicBaseUrl}/api/billing/hubtel/webhook`,
    returnUrl: `${frontend}/vendor/billing?status=success`,
    cancellationUrl: `${frontend}/vendor/billing?status=cancelled`,
  });

  await db.insert(payments).values({
    vendorId,
    purpose: 'subscription',
    amount: amount.toFixed(2),
    tokensGranted: config.billing.monthlyTokens,
    clientReference,
    status: 'pending',
    checkoutUrl: checkout.checkoutUrl,
  });

  return { clientReference, checkoutUrl: checkout.checkoutUrl, amount };
}

/** Create a pending payment + checkout for a token bundle top-up. */
export async function startTokenPurchase(vendorId: string, bundleSize: number) {
  if (!config.tokens.bundleSizes.includes(bundleSize)) {
    throw new Error(`Invalid bundle. Available: ${config.tokens.bundleSizes.join(', ')}`);
  }
  const amount = (bundleSize / 1000) * config.tokens.pricePer1000;
  const clientReference = makeReference(REF_TOKENS);
  const frontend = config.cors.allowedOrigins[0] ?? 'http://localhost:3000';

  const checkout = await initiateCheckout({
    amountGhs: amount,
    description: `Style Savant token bundle (${bundleSize} tokens)`,
    clientReference,
    callbackUrl: `${config.storage.publicBaseUrl}/api/billing/hubtel/webhook`,
    returnUrl: `${frontend}/vendor/billing?status=success`,
    cancellationUrl: `${frontend}/vendor/billing?status=cancelled`,
  });

  await db.insert(payments).values({
    vendorId,
    purpose: 'tokens',
    amount: amount.toFixed(2),
    tokensGranted: bundleSize,
    clientReference,
    status: 'pending',
    checkoutUrl: checkout.checkoutUrl,
  });

  return { clientReference, checkoutUrl: checkout.checkoutUrl, amount };
}

/**
 * Settle a payment (from webhook or status check). Idempotent — a payment
 * only settles once. On success:
 *  - subscription payments extend currentPeriodEnd by 30 days and reset the
 *    monthly token allocation;
 *  - token payments add the bundle to the balance.
 */
export async function settlePayment(clientReference: string, hubtelTransactionId?: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.clientReference, clientReference))
      .limit(1)
      .for('update');

    if (!payment || payment.status === 'paid') return false;

    await tx
      .update(payments)
      .set({ status: 'paid', hubtelTransactionId, updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    if (payment.purpose === 'subscription') {
      const [sub] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.vendorId, payment.vendorId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1)
        .for('update');

      // Extend from the later of now / current period end so paying early
      // never loses days.
      const base = sub?.currentPeriodEnd && sub.currentPeriodEnd > new Date() ? sub.currentPeriodEnd : new Date();
      const newPeriodEnd = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (sub) {
        await tx
          .update(subscriptions)
          .set({
            status: 'active',
            currentPeriodEnd: newPeriodEnd,
            // Fresh month: new allocation on top of whatever is unused.
            tokensTotal: sub.tokensTotal + payment.tokensGranted,
            paymentReference: clientReference,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, sub.id));
      } else {
        await tx.insert(subscriptions).values({
          vendorId: payment.vendorId,
          tokensTotal: payment.tokensGranted,
          tokensUsed: 0,
          status: 'active',
          currentPeriodEnd: newPeriodEnd,
          paymentReference: clientReference,
        });
      }
    }
    return true;
  }).then(async (settled) => {
    // Token bundles reuse TokenManager so the transaction ledger stays consistent.
    if (settled) {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.clientReference, clientReference))
        .limit(1);
      if (payment && payment.purpose === 'tokens') {
        await TokenManager.addTokens(payment.vendorId, payment.tokensGranted, clientReference, {
          source: 'hubtel',
        });
      }
    }
    return settled;
  });
}

export async function markPaymentFailed(clientReference: string): Promise<void> {
  await db
    .update(payments)
    .set({ status: 'failed', updatedAt: new Date() })
    .where(eq(payments.clientReference, clientReference));
}

/**
 * Status-check fallback (mandatory per Hubtel docs when no callback arrives
 * within 5 minutes). Settles the payment if Hubtel reports it Paid.
 */
export async function reconcilePayment(clientReference: string) {
  const result = await checkStatus(clientReference);
  if (result.status === 'Paid') {
    await settlePayment(clientReference, result.transactionId);
  } else if (result.status === 'Unpaid') {
    await markPaymentFailed(clientReference);
  }
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.clientReference, clientReference))
    .limit(1);
  return payment ?? null;
}

/** Billing summary for the vendor billing page. */
export async function getBillingSummary(vendorId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.vendorId, vendorId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const history = await db
    .select()
    .from(payments)
    .where(eq(payments.vendorId, vendorId))
    .orderBy(desc(payments.createdAt))
    .limit(20);

  const now = new Date();
  const inTrial = !!sub?.trialEndsAt && sub.trialEndsAt > now;
  const periodEnd = sub?.currentPeriodEnd ?? null;
  return {
    plan: {
      monthlyFeeGhs: config.billing.monthlyFeeGhs,
      monthlyTokens: config.billing.monthlyTokens,
      tryonTokenCost: config.tokens.tryonCost,
      bundleSizes: config.tokens.bundleSizes,
      pricePer1000: config.tokens.pricePer1000,
    },
    subscription: sub
      ? {
          status: sub.status,
          inTrial,
          trialEndsAt: sub.trialEndsAt,
          currentPeriodEnd: periodEnd,
          needsPayment: !inTrial && (!periodEnd || periodEnd <= now),
          tokensTotal: sub.tokensTotal,
          tokensUsed: sub.tokensUsed,
          tokensRemaining: sub.tokensTotal - sub.tokensUsed,
        }
      : null,
    payments: history,
  };
}
