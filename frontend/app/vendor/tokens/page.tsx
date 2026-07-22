"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Coins, AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVendor } from "@/context/VendorContext";
import { PageHeader, EmptyState } from "@/components/vendor/shared";
import { formatDate, formatCurrency } from "@/lib/utils";

const BUNDLES = [
  { tokens: 1000, ghs: 75 },
  { tokens: 5000, ghs: 350, best: true },
  { tokens: 10000, ghs: 650 },
];

export default function TokensPage() {
  const {
    tokens,
    tokenUsage,
    subscription,
    topUpHistory,
    addTokens,
    addTopUp,
    toast,
  } = useVendor();
  const [selected, setSelected] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pending, setPending] = useState<number | null>(null);

  const low = tokens < 200;
  const spent = tokenUsage.reduce((s, u) => s + u.tokens, 0);
  const allowance = subscription.tokenAllowance;
  const pct = Math.min(100, Math.round((spent / allowance) * 100));

  const pay = () => {
    if (selected === null) return;
    const bundle = BUNDLES.find((b) => b.tokens === selected)!;
    setPending(selected);
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      addTokens(bundle.tokens);
      addTopUp({ date: new Date().toISOString(), tokens: bundle.tokens, ghs: bundle.ghs });
      toast(`+${bundle.tokens.toLocaleString()} tokens added to your wallet!`, "success");
    }, 1600);
  };

  const maxSpend = Math.max(...tokenUsage.map((u) => u.tokens), 1);

  return (
    <div>
      <PageHeader title="Token Wallet" subtitle="GHS 75 per 1,000 tokens · 100% retained by Style Savant" />

      <div className="space-y-5 lg:space-y-6">
        {/* Hero */}
        <div className="rounded-xl bg-teal p-5 lg:p-6 text-white">
          <p className="text-v-meta font-bold uppercase tracking-[0.12em] text-white/70">tokens remaining</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-v-hero font-bold">{tokens.toLocaleString()}</p>
            <div className="w-1/2 max-w-[240px]">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/30">
                <div className="h-full rounded-full bg-vendor-coral-bright" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-right text-v-meta text-white/80">{pct}% used this month</p>
            </div>
          </div>
        </div>

        {low ? (
          <div className="flex items-center gap-2 rounded-xl bg-vendor-amber-tint border border-vendor-amber/20 px-4 py-3 text-v-body text-vendor-amber">
            <AlertTriangle className="h-4 w-4 shrink-0" /> Below 200 tokens. Top up to keep using AI features.
          </div>
        ) : null}

        {/* Desktop: usage + bundles side-by-side */}
        <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-7 space-y-6 lg:space-y-0">
          <section>
            <h2 className="mb-3 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">This Month Usage</h2>
            <div className="overflow-hidden rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark">
              {tokenUsage.map((u) => {
                const share = Math.round((u.tokens / maxSpend) * 100);
                return (
                  <div key={u.feature} className="flex items-center gap-3 border-t border-line dark:border-white/10 px-4 py-3 first:border-t-0">
                    <div className="w-32 shrink-0">
                      <p className="text-v-body font-bold text-ink dark:text-white/90">{u.feature}</p>
                      <p className="text-v-meta text-vendor-text-grey">{u.calls} calls</p>
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-low dark:bg-white/5">
                      <div className="h-full rounded-full bg-vendor-container" style={{ width: `${share}%` }} />
                    </div>
                    <span className="w-14 text-right text-v-body font-bold text-ink dark:text-white/90">{u.tokens}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Top Up Tokens</h2>
            <div className="grid grid-cols-3 gap-4">
              {BUNDLES.map((b) => (
                <button
                  key={b.tokens}
                  onClick={() => setSelected(b.tokens)}
                  className={cn(
                    "relative rounded-xl border p-5 text-left transition-all",
                    selected === b.tokens ? "border-teal bg-vendor-teal-tint shadow-md shadow-teal/10" : "border-line bg-white dark:border-white/10 dark:bg-surface-dark hover:border-ink/30 dark:hover:border-white/20",
                     b.best ? "bg-vendor-container text-white" : "",
                  )}
                >
                  {b.best ? (
                    <span className="absolute -top-2 right-2 rounded-full bg-vendor-coral-bright px-1.5 text-[9px] font-bold">
                      BEST
                    </span>
                  ) : null}
                  <p className={cn("text-v-tsm font-bold", b.best ? "text-white" : "text-ink dark:text-white/90")}>
                    {b.tokens.toLocaleString()}
                  </p>
                  <p className={cn("text-v-meta", b.best ? "text-white/80" : "text-vendor-text-grey")}>
                    tokens
                  </p>
                  <p className={cn("mt-1 text-v-hmd font-bold", b.best ? "text-white" : "text-teal dark:text-off-white")}>
                    GHS {b.ghs}
                  </p>
                </button>
              ))}
            </div>
            <button
              disabled={selected === null}
              onClick={pay}
              className="mt-4 w-full rounded-full bg-vendor-coral-bright py-3 lg:h-btn-d text-v-tsm font-bold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Pay via Paystack
            </button>
            <p className="mt-2 text-v-meta text-vendor-text-grey">
              Tokens credit to your wallet instantly after payment confirmation.
            </p>
            <p className="mt-1 text-v-meta italic text-vendor-text-grey">
              Token system is structured as prepaid software service credit. CODED holds no stored value — all payments processed by Paystack.
            </p>
          </section>
        </div>

        {/* History */}
        <section>
          <h2 className="mb-3 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Top-Up History</h2>
          <div className="overflow-hidden rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark">
            {topUpHistory.length === 0 ? (
              <EmptyState title="No top-ups yet" />
            ) : (
              topUpHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between border-t border-line dark:border-white/10 px-4 py-3 first:border-t-0">
                  <span className="text-v-body text-ink dark:text-white/90">{formatDate(h.date)}</span>
                  <span className="text-v-body text-ink dark:text-white/90">+{h.tokens.toLocaleString()} tk</span>
                  <span className="text-v-body font-bold text-teal dark:text-off-white">{formatCurrency(h.ghs)}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <Dialog.Root open={processing}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/55 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[95] w-[320px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white dark:bg-surface-dark p-6 text-center">
            <Dialog.Title className="sr-only">Processing payment</Dialog.Title>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal dark:text-off-white" />
            <p className="mt-3 text-v-tsm text-ink dark:text-white/90">Processing payment…</p>
            <p className="mt-1 text-v-meta text-vendor-text-grey">
              Paystack checkout · {pending ? BUNDLES.find((b) => b.tokens === pending)!.ghs : ""} GHS
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
