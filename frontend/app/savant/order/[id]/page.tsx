"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/consumer/store";
import { ghs } from "@/lib/consumer/format";
import { Button, TextLink } from "@/components/consumer/Button";
import { BackdropPicker } from "@/components/consumer/BackdropPicker";

export default function OrderConfirmationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { orders, toast, productById } = useApp();
  const order = orders.find((o) => o.id === params.id);
  const [showCheck, setShowCheck] = useState(false);
  const [bpOpen, setBpOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowCheck(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex h-full flex-col bg-teal dark:bg-teal">
      {/* success header (top ~45%) */}
      <div className="flex flex-col items-center justify-center px-page-x pt-12 pb-8">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white/15">
          <svg viewBox="0 0 52 52" className="h-16 w-16">
            <circle cx="26" cy="26" r="24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
            <path
              d="M14 27 L23 36 L39 18"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={showCheck ? "" : "opacity-0"}
              style={{ strokeDasharray: 60, strokeDashoffset: showCheck ? 0 : 60, transition: "stroke-dashoffset 600ms ease" }}
            />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-[26px] font-bold text-white">Order Confirmed!</h1>
        <p className="mt-1 font-display text-sm font-medium text-white/80">
          {order?.number ?? "#SS-XXXXXX"}
        </p>
        {order?.hasDigitalBackdrop && (
          <button
            onClick={() => setBpOpen(true)}
            className="mt-4 rounded-pill bg-white/20 px-4 py-2 font-display text-[13px] font-bold text-white"
          >
            Your backdrop is ready — use it now →
          </button>
        )}
      </div>

      {/* white card with summary */}
      <div className="mt-auto rounded-t-sheet bg-white dark:bg-surface-dark px-page-x pt-6 pb-8">
        <div className="no-scrollbar flex-1 overflow-y-auto">
          <h2 className="font-display text-title-md text-ink dark:text-white">Order summary</h2>
          {order ? (
            <ul className="mt-3 space-y-2">
              {order.items.map((c) => {
                const p = productById(c.productId);
                return (
                  <li key={c.id} className="flex justify-between text-[13px] text-ink-variant dark:text-white/70">
                    <span className="truncate pr-2">{p?.name} ×{c.qty} <span className="text-mid-grey dark:text-white/50">({c.size})</span></span>
                    <span className="shrink-0 font-bold text-ink dark:text-white">{ghs((p?.priceGHS ?? 0) * c.qty)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-body-md text-mid-grey dark:text-white/50">Order details unavailable.</p>
          )}

          <div className="my-3 h-px bg-line dark:bg-white/10" />
          <div className="flex justify-between font-display text-sm font-bold text-ink dark:text-white">
            <span>Total paid</span>
            <span>{order ? ghs(order.totalGHS + 25) : ""}</span>
          </div>
          <p className="mt-3 text-[12px] text-mid-grey dark:text-white/50">
            Estimated delivery: {order?.estimatedDelivery ?? "2-5 business days"}
          </p>
          <button onClick={() => toast("Tracking: Ghana Post tracking number shown.", "neutral")} className="mt-1 block font-display text-[13px] font-bold text-teal hover:underline">
            Track your order →
          </button>
        </div>

        <div className="mt-5 space-y-2 pb-2">
          <Button variant="coral" full onClick={() => router.replace("/savant/feed")}>
            Back to Studio
          </Button>
          <button
            onClick={() => toast("Order details opened.", "neutral")}
            className="block w-full text-center font-display text-sm font-bold text-teal"
          >
            View Order Details
          </button>
        </div>
      </div>

      <BackdropPicker open={bpOpen} onClose={() => setBpOpen(false)} onApply={() => toast("Backdrop applied.", "success")} />
    </div>
  );
}
