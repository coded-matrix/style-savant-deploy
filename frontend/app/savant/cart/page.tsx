"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/consumer/store";
import { ghs } from "@/lib/consumer/format";
import { Button } from "@/components/consumer/Button";
import { EmptyState } from "@/components/consumer/EmptyState";
import { SmartImage } from "@/components/consumer/SmartImage";
import { NumberFlip } from "@/components/consumer/NumberFlip";
import { BottomNav } from "@/components/consumer/BottomNav";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQty, removeFromCart, cartSubtotal, toast, productById } = useApp();

  const hasOOS = cart.some((c) => productById(c.productId)?.soldOut);

  if (cart.length === 0) {
    return (
      <div className="relative flex h-full flex-col bg-surface-bright dark:bg-canvas-dark overflow-hidden pb-[76px] md:pb-0 font-body text-body-md">
        {/* Mobile TopAppBar */}
        <header className="z-30 flex h-14 shrink-0 items-center bg-surface-bright dark:bg-surface-dark px-6 relative">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="text-ink dark:text-white hover:opacity-80 active:scale-95 transition-transform shrink-0 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.28em] font-medium text-ink dark:text-white">
            Cart
          </h1>
        </header>

        <div className="flex flex-1 items-center justify-center px-6">
          <EmptyState
            illustration="hanger"
            headline="Your cart is empty."
            cta={
              <Button variant="coral" size="md" className="w-48" onClick={() => router.push("/savant/feed")}>
                Start Shopping
              </Button>
            }
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-surface-bright dark:bg-canvas-dark overflow-hidden pb-[76px] md:pb-0 font-body text-body-md">
      {/* Mobile TopAppBar */}
      <header className="z-30 flex h-14 shrink-0 items-center bg-surface-bright dark:bg-surface-dark px-6 relative">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="text-ink dark:text-white hover:opacity-80 active:scale-95 transition-transform shrink-0 flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_left</span>
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.28em] font-medium text-ink dark:text-white">
          Cart
        </h1>
      </header>

      {/* Main Content Area */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-6 md:px-16 lg:px-24 pb-28 pt-8 md:pt-16">
        <div className="mx-auto max-w-[1200px]">
        <p className="text-[11px] uppercase tracking-[0.24em] text-mid-grey dark:text-white/60 mb-3">{cart.length} items</p>
        <h2 className="font-serif text-4xl md:text-6xl leading-[0.95] tracking-[-0.02em] font-normal text-ink dark:text-off-white mb-8 md:mb-12">Your Bag</h2>
        
        <div className="space-y-4">
          <AnimatePresence>
          {cart.map((item, index) => {
            const p = productById(item.productId);
            if (!p) return null;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: "-100%" }}
                transition={{ delay: index * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
              <div className="bg-white border border-line/20 rounded-card p-4 relative flex gap-4 dark:bg-surface-dark">
                {/* Image */}
                <div className="h-[96px] w-[96px] shrink-0 overflow-hidden rounded-[16px] bg-surface-low dark:bg-white/5 ring-1 ring-line/10">
                  <SmartImage src={p.images[0]} alt={p.name} seed={p.id} className="h-full w-full object-cover" />
                </div>
                {/* Info */}
                <div className="flex min-w-0 flex-1 flex-col justify-between pr-8 sm:pr-10">
                  <div>
                    <h3 className="truncate font-serif text-[16px] md:text-[18px] font-normal leading-snug text-ink dark:text-off-white">{p.name}</h3>
                    <p className="text-[12px] text-mid-grey dark:text-white/60 mt-0.5">Vendor: {p.vendorName}</p>
                    <p className="text-[12px] text-mid-grey dark:text-white/60 mt-0.5">Variant: {item.size}{item.color ? ` / ${item.color}` : ""}</p>
                  </div>
                  {/* Stack on narrow phones; the image leaves too little room
                      for both the stepper and a currency value in one row. */}
                  <div className="mt-3 flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="flex shrink-0 items-center rounded-pill border border-line/40 w-fit">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        disabled={item.qty <= 1}
                        className="grid h-11 w-9 place-items-center text-ink disabled:opacity-30 dark:text-off-white"
                        aria-label={`Decrease quantity of ${p.name}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="w-6 text-center text-[13px] tabular-nums text-ink dark:text-off-white">
                        <NumberFlip value={item.qty} />
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="grid h-11 w-9 place-items-center text-ink dark:text-off-white"
                        aria-label={`Increase quantity of ${p.name}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                    <span className="max-w-full whitespace-nowrap text-[14px] font-normal tabular-nums tracking-[0.02em] text-ink dark:text-off-white sm:shrink-0 sm:text-[15px] sm:tracking-[0.04em]">
                      {ghs(p.priceGHS * item.qty)}
                    </span>
                  </div>
                </div>
                {/* Delete */}
                <button
                  onClick={() => {
                    removeFromCart(item.id);
                    toast("Item removed from cart.", "neutral");
                  }}
                  className="absolute right-1 top-1 grid h-11 w-11 place-items-center text-mid-grey hover:text-error dark:text-white/60 sm:right-2 sm:top-2"
                  aria-label="Remove item"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.24em] text-mid-grey dark:text-white/60 mb-4">Order Summary</p>
          <div className="bg-white border border-line/20 rounded-card p-5 space-y-3 dark:bg-surface-dark dark:border-white/10">
            <div className="flex min-w-0 items-center justify-between gap-4 text-body-md text-ink-variant dark:text-white/60">
              <span>Subtotal</span>
              <span className="shrink-0 whitespace-nowrap text-ink tabular-nums tracking-[0.04em] dark:text-off-white sm:tracking-[0.08em]"><NumberFlip value={ghs(cartSubtotal)} /></span>
            </div>
            <div className="flex min-w-0 items-start justify-between gap-4 text-body-md text-mid-grey dark:text-white/60">
              <span className="shrink-0">Shipping</span>
              <span className="min-w-0 text-right text-[13px] leading-snug">Calculated at checkout</span>
            </div>
            <div className="h-px bg-line/20 my-2" />
            <div className="flex min-w-0 items-baseline justify-between gap-4">
              <span className="text-[11px] uppercase tracking-[0.24em] text-mid-grey dark:text-white/60">Total</span>
              <span className="shrink-0 whitespace-nowrap font-serif text-[22px] leading-none font-normal tabular-nums text-ink dark:text-off-white sm:text-[24px] md:text-[28px]"><NumberFlip value={ghs(cartSubtotal)} /></span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* sticky checkout */}
      <div className="absolute bottom-[76px] md:bottom-0 inset-x-0 bg-transparent px-6 py-4 z-40">
        <div className="mx-auto max-w-[1200px]">
        <Button
          variant="coral"
          size="md"
          full
          disabled={hasOOS}
          onClick={() => router.push("/savant/checkout")}
        >
          {hasOOS ? "Remove out-of-stock items to continue" : `Checkout · ${ghs(cartSubtotal)}`}
        </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
