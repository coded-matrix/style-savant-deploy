"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVendor } from "@/context/VendorContext";
import { NotificationBell } from "@/components/vendor/SideNav";
import { Logo } from "@/components/consumer/Logo";
import { Coins } from "lucide-react";

export function TopAppBar() {
  const pathname = usePathname();
  const { tokens } = useVendor();
  const hidden = pathname === "/vendor/signup" || pathname === "/vendor/subscription";
  if (hidden) return null;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/60 bg-white/95 backdrop-blur-sm px-4 py-2 text-ink dark:border-white/10 dark:bg-surface-dark/95 dark:text-off-white md:hidden">
      <Link href="/vendor/dashboard" className="flex items-center gap-2">
        <Logo mono="auto" imgClassName="h-6 w-auto object-contain" />
        <span className="micro font-bold uppercase tracking-[0.15em] text-ink dark:text-off-white">
          Vendor
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/vendor/tokens"
          className="flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 micro font-bold uppercase tracking-[0.08em] text-ink dark:bg-white/10 dark:text-off-white"
        >
          <Coins className="h-3 w-3" />
          {tokens} TK
        </Link>
        <NotificationBell />
      </div>
    </header>
  );
}
