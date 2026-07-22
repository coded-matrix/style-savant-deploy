"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Megaphone,
  MoreHorizontal,
  X,
  Wallet,
  Settings,
  Store,
  Coins,
  Bell,
  Ruler,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVendor } from "@/context/VendorContext";

const MAIN = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/products", label: "Products", icon: Package },
  { href: "/vendor/orders", label: "Orders", icon: ShoppingCart },
  { href: "/vendor/campaigns", label: "Videos", icon: Megaphone },
];

const MORE = [
  { href: "/vendor/billing", label: "Billing", icon: Wallet },
  // Payouts disabled — WhatsApp-first checkout means no platform payouts.
  // { href: "/vendor/payouts", label: "Payouts", icon: Wallet },
  { href: "/vendor/settings", label: "Account", icon: Settings },
  { href: "/vendor/storefront", label: "Storefront", icon: Store },
  { href: "/vendor/tokens", label: "Tokens", icon: Coins },
  { href: "/vendor/notifications", label: "Notifications", icon: Bell },
  { href: "/vendor/measurements", label: "Measurements", icon: Ruler },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { notifications } = useVendor();
  const unread = notifications.filter((n) => !n.read).length;

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/vendor/dashboard" && pathname.startsWith(href));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-line/60 bg-white/95 backdrop-blur-sm pb-safe dark:bg-surface-dark/95 dark:border-white/10 md:hidden">
        {MAIN.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 min-w-0 transition-colors duration-200",
                active
                  ? "text-ink dark:text-off-white"
                  : "text-mid-grey dark:text-white/40",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[9px] font-bold uppercase tracking-[0.08em] leading-tight text-center truncate w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[9px] font-bold uppercase tracking-[0.08em] leading-tight text-mid-grey dark:text-white/40"
        >
          <MoreHorizontal className="h-5 w-5 shrink-0" />
          <span className="truncate">More</span>
        </button>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white dark:bg-surface-dark p-5 pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-ink dark:text-white/90">
                More
              </p>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-mid-grey dark:text-white/50" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MORE.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "relative flex flex-col items-center gap-1 rounded-lg border py-3 text-v-meta",
                      active
                        ? "border-ink bg-ink/5 text-ink dark:border-white dark:bg-white/10 dark:text-off-white"
                        : "border-line bg-white dark:border-white/10 dark:bg-surface-dark text-ink dark:text-white/70",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                    {item.href === "/vendor/notifications" && unread > 0 ? (
                      <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 micro font-bold text-white dark:bg-white dark:text-ink">
                        {unread}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
