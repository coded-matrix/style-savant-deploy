"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Loader2, Coins, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useVendor } from "@/context/VendorContext";
import { PageHeader } from "@/components/vendor/shared";
import { billingApi, BillingSummary } from "@/lib/api/billing";
import { formatDate } from "@/lib/utils";

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function BillingPage() {
  const { toast } = useVendor();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSummary(await billingApi.getSummary());
    } catch {
      toast("Could not load billing info.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // Returning from Hubtel checkout (?status=success|cancelled): reconcile the
  // newest pending payment via the status-check fallback, then refresh.
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (!status || !summary) return;
    const pending = summary.payments.find((p) => p.status === "pending");
    if (pending) {
      void billingApi.checkStatus(pending.clientReference).then(() => load());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?.payments.length]);

  const startCheckout = async (kind: "subscribe" | number) => {
    setPaying(String(kind));
    try {
      const res =
        kind === "subscribe"
          ? await billingApi.subscribe()
          : await billingApi.buyTokens(kind);
      window.location.href = res.checkoutUrl;
    } catch (err) {
      toast((err as Error).message || "Could not start payment.", "error");
      setPaying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-mid-grey" />
      </div>
    );
  }

  const sub = summary?.subscription ?? null;
  const plan = summary?.plan;
  const trialDays = daysLeft(sub?.trialEndsAt ?? null);
  const periodDays = daysLeft(sub?.currentPeriodEnd ?? null);
  const usagePct = sub && sub.tokensTotal > 0 ? Math.min(100, (sub.tokensUsed / sub.tokensTotal) * 100) : 0;

  return (
    <div>
      <PageHeader title="Billing" subtitle="Subscription, try-on usage and top-ups" />

      <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0 lg:items-start">
        {/* ── Plan / subscription card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-line bg-white p-6 dark:border-white/10 dark:bg-surface-dark space-y-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-v-tsm font-bold text-ink dark:text-white/90">Monthly plan</p>
              <p className="text-v-meta text-vendor-text-grey">
                GH₵{plan?.monthlyFeeGhs ?? 100}/month · {plan?.monthlyTokens ?? 1200} tokens included
              </p>
            </div>
            {sub?.inTrial ? (
              <span className="rounded-full bg-teal/10 px-3 py-1 text-v-meta font-bold text-teal">
                Free trial · {trialDays}d left
              </span>
            ) : sub?.needsPayment ? (
              <span className="rounded-full bg-vendor-danger/10 px-3 py-1 text-v-meta font-bold text-vendor-danger">
                Payment due
              </span>
            ) : sub ? (
              <span className="rounded-full bg-teal/10 px-3 py-1 text-v-meta font-bold text-teal">
                Active · {periodDays}d left
              </span>
            ) : null}
          </div>

          {/* Token usage meter */}
          {sub ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-v-meta text-vendor-text-grey">
                <span>
                  {sub.tokensRemaining} of {sub.tokensTotal} tokens left
                </span>
                <span>≈ {Math.floor(sub.tokensRemaining / (plan?.tryonTokenCost || 2))} try-ons</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-low dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-teal transition-all"
                  style={{ width: `${100 - usagePct}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-v-meta text-vendor-text-grey">No subscription yet.</p>
          )}

          <button
            onClick={() => startCheckout("subscribe")}
            disabled={paying !== null}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-vendor-coral-bright py-3 text-v-body font-bold text-white disabled:opacity-50"
          >
            {paying === "subscribe" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {sub?.needsPayment ? "Pay GH₵" + (plan?.monthlyFeeGhs ?? 100) + " with Mobile Money" : "Pay next month early"}
          </button>
          <p className="text-center text-v-meta text-vendor-text-grey">
            MTN MoMo, Telecel Cash & AT Money via Hubtel. Each paid month adds{" "}
            {plan?.monthlyTokens ?? 1200} tokens and 30 days.
          </p>
        </motion.div>

        {/* ── Token bundles ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-line bg-white p-6 dark:border-white/10 dark:bg-surface-dark space-y-4"
        >
          <p className="text-v-tsm font-bold text-ink dark:text-white/90">Need more try-ons?</p>
          <p className="text-v-meta text-vendor-text-grey">
            Top up any time — GH₵{plan?.pricePer1000 ?? 75} per 1,000 tokens. A try-on costs{" "}
            {plan?.tryonTokenCost ?? 2} tokens.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(plan?.bundleSizes ?? [1000, 5000, 10000]).map((size) => (
              <button
                key={size}
                onClick={() => startCheckout(size)}
                disabled={paying !== null}
                className="flex flex-col items-center gap-1 rounded-xl border border-line py-4 text-ink transition-colors hover:border-teal hover:bg-teal/5 disabled:opacity-50 dark:border-white/10 dark:text-white/90"
              >
                {paying === String(size) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Coins className="h-4 w-4 text-teal" />
                )}
                <span className="text-v-body font-bold">{size.toLocaleString()}</span>
                <span className="text-v-meta text-vendor-text-grey">
                  GH₵{(size / 1000) * (plan?.pricePer1000 ?? 75)}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Payment history ── */}
      <div className="mt-8">
        <p className="mb-3 text-v-tsm font-bold text-ink dark:text-white/90">Payment history</p>
        {summary && summary.payments.length > 0 ? (
          <div className="space-y-2">
            {summary.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 dark:border-white/10 dark:bg-surface-dark"
              >
                {p.status === "paid" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-teal" />
                ) : p.status === "failed" ? (
                  <XCircle className="h-5 w-5 shrink-0 text-vendor-danger" />
                ) : (
                  <Clock className="h-5 w-5 shrink-0 text-mid-grey" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-v-body font-bold text-ink dark:text-white/90">
                    {p.purpose === "subscription"
                      ? "Monthly subscription"
                      : `${p.tokensGranted.toLocaleString()} token bundle`}
                  </p>
                  <p className="text-v-meta text-vendor-text-grey">
                    {formatDate(p.createdAt)} · GH₵{p.amount} · {p.status}
                  </p>
                </div>
                {p.status === "pending" && p.checkoutUrl ? (
                  <a
                    href={p.checkoutUrl}
                    className="rounded-full border border-line px-4 py-2 text-v-meta font-bold text-ink dark:border-white/10 dark:text-white/90"
                  >
                    Resume
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-v-meta text-vendor-text-grey">No payments yet — your free trial is running.</p>
        )}
      </div>
    </div>
  );
}
