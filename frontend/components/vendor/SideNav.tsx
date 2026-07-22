"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Ruler,
  Megaphone,
  Coins,
  Wallet,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVendor } from "@/context/VendorContext";
import { useSidebar } from "@/lib/vendor/sidebar-context";
import { Logo } from "@/components/consumer/Logo";

const NAV = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/products", label: "Products", icon: Package },
  { href: "/vendor/orders", label: "Orders", icon: ShoppingCart },
  { href: "/vendor/measurements", label: "Measurements", icon: Ruler },
  { href: "/vendor/campaigns", label: "AI Video Requests", icon: Megaphone },
  { href: "/vendor/tokens", label: "Tokens", icon: Coins },
  { href: "/vendor/billing", label: "Billing", icon: Wallet },
  // Payouts disabled — orders are settled directly between the business and
  // the customer over WhatsApp; the platform no longer moves order money.
  // { href: "/vendor/payouts", label: "Payouts", icon: Wallet },
  { href: "/vendor/settings", label: "Settings", icon: Settings },
];

export function SideNav() {
  const pathname = usePathname();
  const { tokens, storefront } = useVendor();
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-line bg-surface-bright text-ink dark:border-white/10 dark:bg-surface-dark dark:text-off-white md:flex transition-all duration-200 ease-in-out antialiased",
        collapsed ? "w-[68px]" : "w-[280px]",
      )}
    >
      <div
        className={cn(
          "flex items-center pt-5 pb-6",
          collapsed ? "px-3 justify-center" : "px-6 justify-between",
        )}
      >
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "flex items-center cursor-pointer rounded-lg hover:bg-surface-low dark:hover:bg-white/5 transition-colors",
            collapsed ? "justify-center p-1.5" : "gap-3",
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Logo mono="auto" imgClassName={cn("object-contain", collapsed ? "h-7 w-auto" : "h-9 w-auto")} />
          {!collapsed && (
            <div className="leading-tight text-left">
              <p className="text-[13px] font-bold uppercase tracking-[0.12em]">
                Style Savant
              </p>
              <p className="micro text-mid-grey dark:text-white/40 tracking-[0.12em] uppercase">
                Vendor
              </p>
            </div>
          )}
        </button>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="flex items-center justify-center rounded-lg p-1.5 text-mid-grey hover:text-ink dark:text-white/40 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="mx-5 mb-6 rounded-xl bg-surface-low p-4 dark:bg-white/5">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink dark:text-white/90">
            {storefront.businessName}
          </p>
          <p className="text-v-meta text-mid-grey dark:text-white/40">
            Fashion House · Accra
          </p>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/vendor/dashboard" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-4 rounded-lg transition-colors border border-transparent",
                collapsed ? "justify-center px-0 py-3" : "px-4 py-3",
                active
                  ? "border-line bg-surface-low text-ink dark:border-white/10 dark:bg-white/5 dark:text-off-white"
                  : "text-mid-grey hover:text-ink hover:bg-surface-low dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5",
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && (
                <span className="text-v-meta font-bold uppercase tracking-[0.12em]">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("mb-4", collapsed ? "px-3" : "px-5")}>
        <Link
          href="/vendor/tokens"
          title={collapsed ? "Token balance" : undefined}
          className={cn(
            "flex items-center rounded-xl bg-ink/5 px-4 py-3 dark:bg-white/5",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          <Coins className="h-4 w-4 text-ink dark:text-white/70 shrink-0" />
          {!collapsed && (
            <>
              <span className="text-v-meta text-mid-grey dark:text-white/50">
                Token balance
              </span>
              <span className="text-v-meta font-bold text-ink dark:text-off-white">
                {tokens} TK
              </span>
            </>
          )}
        </Link>
      </div>
    </aside>
  );
}

export function NotificationBell() {
  const { notifications } = useVendor();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <Link
      href="/vendor/notifications"
      className="relative rounded-full p-1.5 text-ink hover:text-black dark:text-off-white dark:hover:text-white"
      aria-label="Notifications"
    >
      <Bell className="h-4 w-4" />
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 micro font-bold text-white dark:bg-white dark:text-ink">
          {unread}
        </span>
      ) : null}
    </Link>
  );
}
