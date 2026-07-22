"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, X } from "lucide-react";
import { useState } from "react";
import type { PaywallState } from "@/context/VendorContext";

const BUNDLES = [
  { tokens: 1000, ghs: 75 },
  { tokens: 5000, ghs: 350, best: true },
];

export function TokenPaywallBridge({
  paywall,
  currentTokens,
  closePaywall,
  buyAndProceed,
}: {
  paywall: PaywallState;
  currentTokens: number;
  closePaywall: () => void;
  buyAndProceed: (
    bundleTokens: number,
    ghs: number,
    action?: () => void,
  ) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const after = paywall.open ? Math.max(0, currentTokens - paywall.cost) : 0;

  return (
    <Dialog.Root
      open={paywall.open}
      onOpenChange={(o) => {
        if (!o) closePaywall();
      }}
    >
      <Dialog.Portal>
        <AnimatePresence>
          {paywall.open && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
              <Dialog.Overlay asChild>
                <motion.div
                  className="absolute inset-0 bg-black/55"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className="relative z-[95] w-[360px] max-w-[calc(100%-2rem)] rounded-lg border border-line bg-white dark:border-white/15 dark:bg-surface-dark"
                >
                  <div className="flex items-center justify-between rounded-t-lg bg-ink px-4 py-3 dark:bg-white">
                    <Dialog.Title className="text-v-title text-white dark:text-ink">
                      Top Up Required
                    </Dialog.Title>
                    <Dialog.Close className="text-white/70 hover:text-white dark:text-ink/70 dark:hover:text-ink" aria-label="Close">
                      <X className="h-4 w-4" />
                    </Dialog.Close>
                  </div>

                  <div className="p-5">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 dark:bg-white/10">
                      <Coins className="h-6 w-6 text-ink dark:text-off-white" />
                    </div>
                    <p className="text-center text-v-tsm font-bold text-ink dark:text-white">Not enough tokens</p>
                    <div className="mt-3 space-y-1 text-center text-v-body text-mid-grey dark:text-white/70">
                      <p>This action requires {paywall.cost} tokens.</p>
                      <p>
                        You have: {currentTokens} tokens · You need: {paywall.cost} tokens
                      </p>
                      <p className={after > 0 ? "text-ink dark:text-white" : "text-error"}>
                        After this action: {after} tokens remaining
                      </p>
                    </div>

                    <div className="my-4 h-px bg-line dark:bg-white/15" />

                    <p className="mb-2 text-v-meta uppercase tracking-wide text-mid-grey dark:text-white/70">
                      Select a bundle
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {BUNDLES.map((b) => (
                        <button
                          key={b.tokens}
                          onClick={() => setSelected(b.tokens)}
                          className={`relative rounded-md border p-3 text-left transition-colors ${
                            selected === b.tokens
                              ? "border-ink bg-ink/5 dark:border-white dark:bg-white/10"
                              : "border-line dark:border-white/15"
                          }`}
                        >
                          {b.best && (
                            <span className="absolute -top-2 right-2 rounded-full bg-ink px-1.5 text-[9px] font-bold text-white dark:bg-white dark:text-ink">
                              BEST
                            </span>
                          )}
                          <p className="text-v-tsm font-bold text-ink dark:text-white">
                            {b.tokens.toLocaleString()} tk
                          </p>
                          <p className="text-v-cap text-mid-grey dark:text-white/70">GHS {b.ghs}</p>
                          {selected === b.tokens && (
                            <span className="absolute right-2 top-2 text-ink dark:text-white">✓</span>
                          )}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={selected === null}
                      onClick={() =>
                        selected !== null &&
                        buyAndProceed(
                          selected,
                          BUNDLES.find((b) => b.tokens === selected)!.ghs,
                          paywall.onProceed,
                        )
                      }
                      className="mt-4 w-full rounded-md bg-ink px-4 py-2.5 text-v-tsm font-bold text-white disabled:opacity-40 dark:bg-white dark:text-ink"
                    >
                      Buy Tokens via Paystack
                    </button>

                    <p className="mt-3 text-center text-v-meta text-mid-grey dark:text-white/70">
                      Tokens credit instantly after Paystack payment. Partial deductions never
                      occur — the action either runs completely or not at all.
                    </p>
                  </div>
                </motion.div>
              </Dialog.Content>
            </div>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
