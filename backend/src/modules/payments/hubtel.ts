import { config } from '../../config/env';

/**
 * Thin Hubtel client, ported from the coded_matrix esports backend
 * (payments/utils.py). Two calls:
 *  - initiateCheckout: create a hosted checkout; the customer approves the
 *    mobile-money charge on their phone, Hubtel then POSTs our webhook.
 *  - checkStatus: mandatory fallback when no callback arrives within 5 min.
 *
 * Auth is HTTP Basic with base64(API_ID:API_KEY).
 */

function authHeader(): string {
  const { apiId, apiKey } = config.hubtel;
  return `Basic ${Buffer.from(`${apiId}:${apiKey}`).toString('base64')}`;
}

async function hubtelFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.hubtel.timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export interface HubtelCheckout {
  checkoutUrl: string;
  checkoutId?: string;
}

export async function initiateCheckout(input: {
  amountGhs: number;
  description: string;
  clientReference: string;
  callbackUrl: string;
  returnUrl: string;
  cancellationUrl: string;
}): Promise<HubtelCheckout> {
  const res = await hubtelFetch(config.hubtel.paymentUrl, {
    method: 'POST',
    body: JSON.stringify({
      totalAmount: Number(input.amountGhs.toFixed(2)),
      description: input.description,
      callbackUrl: input.callbackUrl,
      returnUrl: input.returnUrl,
      cancellationUrl: input.cancellationUrl,
      merchantAccountNumber: config.hubtel.merchantAccountNumber,
      clientReference: input.clientReference,
    }),
  });

  const payload = (await res.json().catch(() => null)) as
    | { data?: { checkoutUrl?: string; checkoutId?: string } }
    | null;

  if (!res.ok || !payload?.data?.checkoutUrl) {
    throw new Error(`Hubtel checkout initiation failed (HTTP ${res.status})`);
  }
  return { checkoutUrl: payload.data.checkoutUrl, checkoutId: payload.data.checkoutId };
}

export type HubtelTxnStatus = 'Paid' | 'Unpaid' | 'Refunded' | 'Unknown';

export async function checkStatus(clientReference: string): Promise<{
  status: HubtelTxnStatus;
  transactionId?: string;
}> {
  const base = config.hubtel.statusUrl.replace(/\/$/, '');
  const account = encodeURIComponent(config.hubtel.merchantAccountNumber);
  const res = await hubtelFetch(
    `${base}/transactions/${account}/status?clientReference=${encodeURIComponent(clientReference)}`,
    { method: 'GET' },
  );

  const payload = (await res.json().catch(() => null)) as
    | { responseCode?: string; data?: { status?: string; transactionId?: string } }
    | null;

  if (!res.ok || payload?.responseCode !== '0000') {
    return { status: 'Unknown' };
  }
  const status = payload.data?.status;
  return {
    status: status === 'Paid' || status === 'Unpaid' || status === 'Refunded' ? status : 'Unknown',
    transactionId: payload.data?.transactionId,
  };
}
