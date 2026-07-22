"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVendor } from "@/context/VendorContext";
import { PLAN_DETAILS } from "@/lib/vendor/seed";
import type { SubscriptionTier } from "@/lib/vendor/types";

const TIERS: SubscriptionTier[] = ["starter", "growth", "pro"];

export default function SubscriptionPage() {
  const router = useRouter();
  const { subscription, setSubscription, toast } = useVendor();
  const [selected, setSelected] = useState<SubscriptionTier | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pendingTier, setPendingTier] = useState<SubscriptionTier | null>(null);

  const choose = (tier: SubscriptionTier) => {
    setPendingTier(tier);
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const details = PLAN_DETAILS[tier];
      setSubscription({
        tier,
        renewalDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        listingCap: details.listingCap,
        tokenAllowance: details.allowance,
        tokensUsed: subscription.tokensUsed,
      });
      toast(`Plan activated: ${details.name}!`, "success");
      router.push("/vendor/dashboard");
    }, 1600);
  };

  return (
    <div className="min-h-screen bg-vendor-canvas">
      <div className="bg-vendor-surface-dark px-4 py-4">
        <h1 className="text-center text-v-title font-bold text-white">
          Choose your plan
        </h1>
        <p className="mt-1 text-center text-v-meta text-white/60">
          Billed monthly via Paystack. You can upgrade at any time.
        </p>
      </div>

      <div className="space-y-5 px-4 py-5 lg:space-y-6">
        {TIERS.map((tier) => {
          const d = PLAN_DETAILS[tier];
          const isCurrent = subscription.tier === tier;
          const popular = tier === "growth";
          const isPaid = tier !== "starter";
          return (
            <div
              key={tier}
              className={cn(
                "relative rounded-xl border bg-white dark:bg-surface-dark p-6",
                isCurrent ? "border-teal dark:border-teal" : "border-line dark:border-white/10",
              )}
            >
              {popular && (
                <span className="absolute -top-2 right-4 rounded-full bg-vendor-coral-bright px-2 py-0.5 text-v-meta font-bold uppercase tracking-[0.12em] text-white">
                  Most Popular
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <h2 className="text-v-hmd">{d.name}</h2>
                <span className="text-v-hlg font-bold text-teal dark:text-off-white">{d.price}</span>
              </div>
              <div className="my-3 h-px bg-line dark:bg-white/15" />
              <ul className="space-y-1.5">
                {d.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-v-body text-ink dark:text-white/90">
                    <Check className="h-4 w-4 shrink-0 text-vendor-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={isCurrent}
                onClick={() => choose(tier)}
                className={cn(
                  "mt-4 w-full rounded-xl py-3 lg:h-btn-d text-v-tsm font-bold text-white",
                  isCurrent
                    ? "cursor-default bg-mid-grey/30 text-mid-grey"
                    : isPaid
                      ? "bg-vendor-coral-bright"
                      : "bg-mid-grey/50",
                )}
              >
                {isCurrent ? "Current Plan" : tier === "starter" ? "Start Free" : `Choose ${d.name}`}
              </button>
            </div>
          );
        })}
        <p className="text-center text-v-meta text-vendor-text-grey">
          Token top-ups available on all plans from GHS 75 / 1,000 tokens.
        </p>
      </div>

      <Dialog.Root open={processing}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/55 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[95] w-[320px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white dark:bg-surface-dark p-6 text-center">
            <Dialog.Title className="sr-only">Processing payment</Dialog.Title>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal dark:text-off-white" />
            <p className="mt-3 text-v-tsm text-ink dark:text-white/90">Processing your subscription…</p>
            <p className="mt-1 text-v-meta text-vendor-text-grey">
              Secure Paystack checkout for {pendingTier ? PLAN_DETAILS[pendingTier].name : ""}
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
