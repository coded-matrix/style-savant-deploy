"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useVendor } from "@/context/VendorContext";
import { PageHeader, ConfirmDialog } from "@/components/vendor/shared";
import { PLAN_DETAILS } from "@/lib/vendor/seed";

export default function SubscriptionManagePage() {
  const { subscription, setSubscription, products, tokens, toast } = useVendor();
  const plan = PLAN_DETAILS[subscription.tier];
  const router = useRouter();

  const listingPct = Math.round((products.length / subscription.listingCap) * 100);
  const tokenPct = Math.round((subscription.tokensUsed / subscription.tokenAllowance) * 100);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [downgradeOpen, setDowngradeOpen] = useState(false);

  const downgrade = () => {
    setSubscription({
      ...subscription,
      tier: "starter",
      listingCap: PLAN_DETAILS.starter.listingCap,
      tokenAllowance: PLAN_DETAILS.starter.allowance,
    });
    setDowngradeOpen(false);
    toast("Plan will downgrade on next billing cycle.", "info");
  };

  const cancelPlan = () => {
    setCancelOpen(false);
    toast("Subscription cancelled. Access until end of cycle.", "info");
  };

  return (
    <div>
      <PageHeader title="Subscription" subtitle="Manage your Style Savant vendor plan" />

      <div className="space-y-5 lg:space-y-6">
        <div className="rounded-xl bg-vendor-surface-dark p-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-v-hmd font-bold">{plan.name}</h2>
            <span className="rounded-full bg-vendor-success/20 px-2 py-0.5 text-v-meta font-bold text-vendor-success">
              ACTIVE
            </span>
          </div>
          <p className="mt-1 text-v-hlg font-bold text-teal dark:text-off-white">{plan.price}</p>
          <p className="text-v-meta text-white/50">
            Renews on {new Date(subscription.renewalDate).toLocaleDateString("en-GH")}
          </p>
          <button className="mt-3 rounded-full bg-vendor-coral-bright px-4 py-2 lg:h-btn-d text-v-body font-bold text-white">
            Manage via Paystack
          </button>
        </div>

        <section>
          <h3 className="mb-2 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Plan Includes</h3>
          <div className="space-y-1.5 rounded-xl border border-line dark:border-white/10 bg-white dark:bg-surface-dark p-4">
            {plan.features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-v-body text-ink dark:text-white/90">
                <Check className="h-4 w-4 text-vendor-success" />
                {f}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Usage This Cycle</h3>
          <div className="space-y-4 rounded-xl border border-line dark:border-white/10 bg-white dark:bg-surface-dark p-4">
            <UsageBar label="Listings" used={products.length} cap={subscription.listingCap} />
            <UsageBar label="Tokens" used={subscription.tokensUsed} cap={subscription.tokenAllowance} />
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Change Plan</h3>
          {subscription.tier !== "pro" ? (
            <button
              onClick={() => router.push("/vendor/subscription")}
              className="w-full rounded-full bg-vendor-coral-bright py-3 lg:h-btn-d text-v-tsm font-bold text-white"
            >
              Upgrade to {subscription.tier === "starter" ? "Growth" : "Pro"}
            </button>
          ) : null}
          {subscription.tier !== "starter" ? (
            <button
              onClick={() => setDowngradeOpen(true)}
              className="w-full rounded-full border border-line dark:border-white/10 bg-white dark:bg-surface-dark py-3 lg:h-btn-d text-v-tsm font-bold text-ink dark:text-white/90"
            >
              Downgrade to {subscription.tier === "pro" ? "Growth" : "Starter"}
            </button>
          ) : null}
        </section>

        <section>
          <h3 className="text-v-tsm text-vendor-danger">Cancel Subscription</h3>
          <p className="mt-1 text-v-body text-vendor-text-grey">
            You will lose access at end of current billing cycle. All your data will be
            preserved.
          </p>
          <button
            onClick={() => setCancelOpen(true)}
            className="mt-2 rounded-full border border-vendor-danger/30 px-4 py-2 text-v-body font-bold text-vendor-danger"
          >
            Cancel Subscription
          </button>
        </section>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel your subscription?"
        description="You will lose access at the end of the current cycle. Your store remains intact."
        confirmLabel="Yes, Cancel"
        destructive
        onConfirm={cancelPlan}
      />
      <ConfirmDialog
        open={downgradeOpen}
        onOpenChange={setDowngradeOpen}
        title={`Downgrade to Starter?`}
        description="Your listing count will reduce to 10 on next billing date. Listings above the cap will be archived."
        confirmLabel="Downgrade"
        onConfirm={downgrade}
      />
    </div>
  );
}

function UsageBar({ label, used, cap }: { label: string; used: number; cap: number }) {
  const pct = Math.min(100, Math.round((used / cap) * 100));
  return (
    <div>
      <div className="flex justify-between">
        <span className="text-v-body text-ink dark:text-white/90">{label}</span>
        <span className="text-v-body text-vendor-text-grey">
          {used} / {cap}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-low dark:bg-white/5">
        <div
          className={`h-full rounded-full ${pct > 80 ? "bg-vendor-amber" : pct >= 100 ? "bg-vendor-danger" : "bg-teal"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
