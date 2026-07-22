"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Paystack redirect — server has nothing to prerender.
export const dynamic = "force-dynamic";

export default function TokensCallbackPage() {
  useEffect(() => {
    // The real backend Paystack callback handling will land alongside the
    // backend token endpoints. For now we just acknowledge the redirect.
  }, []);

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-canvas-dark p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-surface-dark rounded-xl border border-line dark:border-white/10 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h1 className="mt-4 text-2xl font-bold text-ink dark:text-white">Thanks for your purchase</h1>
        <p className="mt-2 text-mid-grey dark:text-white/60">
          Your payment is being confirmed. Tokens will appear on your balance
          once the backend confirms the transaction.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/tokens">
            <Button className="w-full">Back to tokens</Button>
          </Link>
          <Link href="/">
            <Button className="w-full" variant="ghost">
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}