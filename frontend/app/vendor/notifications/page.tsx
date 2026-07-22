"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  Coins,
  Wallet,
  BellOff,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVendor } from "@/context/VendorContext";
import { PageHeader, Chip, EmptyState } from "@/components/vendor/shared";
import type { NotificationCategory } from "@/lib/vendor/types";

const CAT_ICON: Record<NotificationCategory, {
  Icon: typeof ShoppingCart;
  bg: string;
}> = {
  orders: { Icon: ShoppingCart, bg: "bg-teal/10 text-teal dark:text-off-white" },
  stock: { Icon: Package, bg: "bg-vendor-amber-tint text-vendor-amber" },
  tokens: { Icon: Coins, bg: "bg-vendor-amber-tint text-vendor-amber" },
  payouts: { Icon: Wallet, bg: "bg-vendor-success/10 text-vendor-success" },
  system: { Icon: BellOff, bg: "bg-mid-grey/10 text-mid-grey" },
};

const FILTERS: (NotificationCategory | "all")[] = [
  "all",
  "orders",
  "stock",
  "tokens",
  "payouts",
  "system",
];

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markAllRead } = useVendor();
  const [filter, setFilter] = useState<NotificationCategory | "all">("all");
  const [localNotifs, setLocalNotifs] = useState(notifications);

  useMemo(() => setLocalNotifs(notifications), [notifications]);

  const filtered = localNotifs.filter((n) =>
    filter === "all" ? true : n.category === filter,
  );

  const handleTap = (idx: number) => {
    const updated = [...localNotifs];
    updated[idx] = { ...updated[idx], read: true };
    setLocalNotifs(updated);
    const n = updated[idx];
    if (n.link) router.push(n.link);
  };

  const markAll = () => {
    markAllRead();
    setLocalNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unread = localNotifs.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread`}
        action={
          <button
            onClick={markAll}
            className="flex items-center gap-1 text-v-body font-bold text-teal dark:text-off-white"
          >
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </button>
        }
      />

      <div className="space-y-6 lg:space-y-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
            </Chip>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            hint="They will appear here as activity happens on your store."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark">
            {filtered.map((n, i) => {
              const cfg = CAT_ICON[n.category];
              const Icon = cfg.Icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    onClick={() => handleTap(i)}
                    className={cn(
                      "flex w-full items-center gap-3 border-t border-line dark:border-white/10 px-4 py-3.5 first:border-t-0 text-left transition-colors hover:bg-surface-low dark:hover:bg-white/[0.02]",
                      !n.read ? "bg-vendor-teal-tint" : "",
                    )}
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cfg.bg)}>
                      <Icon className="h-4 w-4" />
                      {!n.read ? (
                        <span className="absolute -mt-6 ml-6 h-2 w-2 rounded-full bg-vendor-coral-bright" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-v-body", !n.read ? "font-bold text-ink dark:text-white/90" : "text-vendor-text-grey")}>
                        {n.text}
                      </p>
                    </div>
                    <span className="shrink-0 text-v-meta text-vendor-text-grey">{n.time}</span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
