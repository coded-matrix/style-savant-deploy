import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import {
  startSubscriptionPayment,
  startTokenPurchase,
  settlePayment,
  markPaymentFailed,
  reconcilePayment,
  getBillingSummary,
} from './payment.service';

/** GET /api/payments/billing — plan, subscription state and payment history. */
export async function billingSummary(req: AuthRequest, res: Response) {
  try {
    res.json(await getBillingSummary(req.vendorId!));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

/** POST /api/payments/subscribe — start the monthly-fee Hubtel checkout. */
export async function subscribe(req: AuthRequest, res: Response) {
  try {
    res.status(201).json(await startSubscriptionPayment(req.vendorId!));
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
}

/** POST /api/payments/tokens — start a token-bundle Hubtel checkout. */
export async function buyTokens(req: AuthRequest, res: Response) {
  try {
    const bundleSize = Number(req.body?.bundleSize);
    if (!Number.isFinite(bundleSize)) {
      res.status(400).json({ error: 'bundleSize is required' });
      return;
    }
    res.status(201).json(await startTokenPurchase(req.vendorId!, bundleSize));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

/**
 * POST /api/payments/hubtel/webhook — Hubtel callback (public endpoint).
 * Mirrors coded_matrix's webhook: settle on ResponseCode 0000 + Success,
 * mark failed otherwise. Always 200 so Hubtel stops retrying; unknown
 * references are ignored (settlePayment is idempotent and reference-scoped).
 */
export async function hubtelWebhook(req: Request, res: Response) {
  try {
    const payload = req.body as {
      ResponseCode?: string;
      Status?: string;
      Data?: { ClientReference?: string; TransactionId?: string; Status?: string };
    };
    const data = payload?.Data;
    const reference = data?.ClientReference;
    if (reference) {
      const ok =
        payload.ResponseCode === '0000' &&
        (data?.Status === undefined || data.Status === 'Success' || data.Status === 'Paid');
      if (ok) {
        await settlePayment(reference, data?.TransactionId);
      } else {
        await markPaymentFailed(reference);
      }
    }
  } catch (err) {
    console.error('Hubtel webhook error:', err);
  }
  res.status(200).json({ received: true });
}

/**
 * GET /api/payments/status/:reference — status-check fallback for when no
 * webhook arrived within 5 minutes; reconciles against Hubtel then returns
 * our payment record.
 */
export async function paymentStatus(req: AuthRequest, res: Response) {
  try {
    const payment = await reconcilePayment(req.params.reference);
    if (!payment || payment.vendorId !== req.vendorId) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }
    res.json({ status: payment.status, purpose: payment.purpose, amount: payment.amount });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
