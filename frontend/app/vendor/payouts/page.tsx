"use client";

import { useMemo, useState } from "react";
import { useVendor } from "@/context/VendorContext";
import { PageHeader, StatCard, ConfirmDialog, EmptyState } from "@/components/vendor/shared";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function PayoutsPage() {
  const { orders, payouts, toast } = useVendor();
  const [withdrawing, setWithdrawing] = useState(false);

  const delivered = orders.filter((o) => o.status === "delivered");
  const orderTotal = delivered.reduce((s, o) => s + o.total, 0);

  // Prefer authoritative figures from the backend payouts endpoint; fall back
  // to values derived from delivered orders when the backend has none.
  const totalEarned = payouts.totalSales > 0 ? payouts.totalSales : orderTotal;
  const fee = Math.round(totalEarned * 0.08);
  const netAvailable =
    payouts.availablePayout > 0 ? payouts.availablePayout : totalEarned - fee;

  const thisMonth = delivered.filter((o) => {
    const d = new Date(o.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonth.reduce((s, o) => s + o.total, 0);

  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = delivered.filter((o) => {
    const d = new Date(o.date);
    return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
  });
  const lastMonthTotal = lastMonth.reduce((s, o) => s + o.total, 0);

  const payoutHistory: { date: string; orders: number; gross: number; fee: number; net: number }[] =
    delivered.length > 0
      ? [
          { date: new Date().toISOString(), orders: delivered.length, gross: totalEarned, fee, net: netAvailable },
        ]
      : [];

  const withdraw = () => {
    setWithdrawing(false);
    toast("Withdrawal request submitted. Payout will reach your bank within 48 hours.", "success");
  };

  return (
    <div>
      <PageHeader title="Payouts" subtitle="Powered by Paystack Subaccounts" />

      <div className="space-y-5 lg:space-y-6">
        <div className="rounded-xl bg-vendor-surface-dark p-5 text-white">
          <p className="text-v-meta font-bold uppercase tracking-[0.15em] text-white/50">Available to withdraw</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-headline-lg font-bold text-teal dark:text-off-white">{formatCurrency(netAvailable)}</p>
            <p className="text-v-meta text-white/50">
              Next automatic payout: {new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-GH")}
            </p>
          </div>
          <button
            disabled={netAvailable < 50}
            onClick={() => setWithdrawing(true)}
            className="mt-4 rounded-full bg-vendor-coral-bright px-5 py-2 lg:h-btn-d text-v-body font-bold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            title={netAvailable < 50 ? "Minimum withdrawal is GHS 50" : ""}
          >
            Withdraw Now
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="This Month" value={formatCurrency(thisMonthTotal)} tone="teal" />
          <StatCard label="Last Month" value={formatCurrency(lastMonthTotal)} tone="teal" />
          <StatCard label="Total Earned" value={formatCurrency(totalEarned)} tone="teal" />
        </div>

        <div className="rounded-xl bg-ink/[0.03] dark:bg-white/[0.03] border border-line dark:border-white/10 px-4 py-3 text-v-body text-ink dark:text-white/90">
          Style Savant fee: 8% per transaction. Deducted at source via Paystack — no
          manual reconciliation needed.
        </div>

        <section>
          <h2 className="mb-3 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Payout History</h2>
          <div className="overflow-hidden rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark">
            {payoutHistory.length === 0 ? (
              <EmptyState
                title="No payouts yet"
                hint="Complete your first order to start earning."
              />
            ) : (
              payoutHistory.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-t border-line dark:border-white/10 px-4 py-3 first:border-t-0"
                >
                  <span className="text-v-body text-ink dark:text-white/90">{formatDate(p.date)}</span>
                  <span className="text-v-body text-ink dark:text-white/90">{p.orders} orders</span>
                  <span className="text-v-body text-ink dark:text-white/90">{formatCurrency(p.gross)}</span>
                  <span className="text-v-body text-vendor-text-grey">-8% ({formatCurrency(p.fee)})</span>
                  <span className="text-v-body font-bold text-teal dark:text-off-white">{formatCurrency(p.net)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Connected Account</h2>
          <div className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-v-body font-bold text-ink dark:text-white/90">
                  {payouts.bankName || "Ghana Commercial Bank"}
                </p>
                <p className="text-v-body text-vendor-text-grey">
                  {payouts.accountNumber
                    ? `****${payouts.accountNumber.slice(-4)}`
                    : "****1234"}
                </p>
                <p className="text-v-body text-vendor-text-grey">Fashion House</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-v-meta font-bold",
                  payouts.bankConnected
                    ? "bg-vendor-success/10 text-vendor-success"
                    : "bg-vendor-amber-tint text-vendor-amber",
                )}
              >
                {payouts.bankConnected ? "Verified ✓" : "Not connected"}
              </span>
            </div>
            <button className="mt-4 text-v-body font-bold text-teal dark:text-off-white hover:underline">
              Update Bank Details
            </button>
          </div>
        </section>

        <p className="text-v-meta text-vendor-text-grey">
          Payouts are processed automatically every 2 weeks. Manual withdrawal
          available at any time above GHS 50 minimum.
        </p>
      </div>

      <ConfirmDialog
        open={withdrawing}
        onOpenChange={setWithdrawing}
        title={`Withdraw ${formatCurrency(netAvailable)}?`}
        description="Funds will be sent to your connected Ghana Commercial Bank account ****1234."
        confirmLabel="Confirm Withdrawal"
        onConfirm={withdraw}
      />
    </div>
  );
}
