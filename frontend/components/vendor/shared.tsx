"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus, ProductStatus } from "@/lib/vendor/types";

const THUMB_COLORS = [
  "from-thumb-1a to-thumb-1b",
  "from-thumb-2a to-thumb-2b",
  "from-thumb-3a to-thumb-3b",
  "from-thumb-4a to-thumb-4b",
];

export function Thumb({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const idx =
    name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
    THUMB_COLORS.length;
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md bg-gradient-to-br text-white",
        THUMB_COLORS[idx],
        className,
      )}
    >
      <span className="text-[10px] font-bold">{initials || "?"}</span>
    </div>
  );
}

const PRODUCT_STATUS: Record<ProductStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-ink/10 text-ink dark:text-white/80" },
  draft: { label: "Draft", cls: "bg-ink/5 text-mid-grey dark:text-white/50" },
  sold_out: { label: "Sold Out", cls: "bg-ink/5 text-ink dark:text-white/60" },
  archived: { label: "Archived", cls: "bg-line text-mid-grey dark:text-white/40" },
};

const ORDER_STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-ink/5 text-ink dark:text-white/80" },
  confirmed: { label: "Confirmed", cls: "bg-ink/10 text-ink dark:text-white/90" },
  packed: { label: "Packed", cls: "bg-ink/10 text-ink dark:text-white/90" },
  shipped: { label: "Shipped", cls: "bg-ink/10 text-ink dark:text-white/90" },
  delivered: { label: "Delivered", cls: "bg-ink/15 text-ink dark:text-white" },
  cancelled: { label: "Cancelled", cls: "bg-error/10 text-error dark:text-white/60" },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const s = PRODUCT_STATUS[status];
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em]", s.cls)}>
      {s.label}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em]", s.cls)}>
      {s.label}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  backHref,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backHref?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 lg:mb-14">
      <div className="min-w-0">
        {backHref ? (
          <Link href={backHref} className="mb-2 inline-block text-v-body lg:text-v-body-d text-teal dark:text-off-white hover:underline">
            ← Back
          </Link>
        ) : null}
        <h1 className="font-serif text-v-hlg-m md:text-v-hlg xl:text-v-hero-d font-normal leading-[0.95] tracking-[-0.02em] text-ink dark:text-off-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-v-body lg:text-v-body-d text-mid-grey dark:text-white/50 font-sans uppercase tracking-[0.15em]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "teal",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "teal" | "coral" | "green" | "amber" | "danger";
}) {
  const toneCls = {
    teal: "text-ink dark:text-off-white",
    coral: "text-ink dark:text-off-white",
    green: "text-ink dark:text-off-white",
    amber: "text-ink dark:text-off-white",
    danger: "text-ink dark:text-off-white",
  }[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-line bg-white dark:bg-surface-dark dark:border-white/10 p-5 lg:p-6 xl:p-7 transition-shadow hover:shadow-md hover:shadow-ink/5 dark:hover:shadow-black/20"
    >
      <p className="text-v-meta lg:text-v-cap uppercase tracking-[0.15em] text-mid-grey dark:text-white/50 font-bold">
        {label}
      </p>
      <p className={cn("mt-3 font-display text-[22px] md:text-[24px] xl:text-[26px] lining-nums tabular-nums tracking-[-0.01em] font-medium leading-[1.1] whitespace-nowrap", toneCls)}>
        {value}
      </p>
      {sub ? <p className="mt-1.5 text-v-meta lg:text-v-cap uppercase tracking-[0.1em] text-mid-grey dark:text-white/40 font-bold">{sub}</p> : null}
    </motion.div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-2.5 py-1 lg:px-4 lg:py-2 text-[11px] lg:text-v-body transition-all duration-200 uppercase tracking-[0.05em] lg:tracking-[0.06em] font-medium active:scale-95 focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2",
        active
          ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink shadow-sm"
          : "border-line bg-white dark:bg-surface-dark dark:border-white/10 text-ink dark:text-off-white hover:bg-surface-low dark:hover:bg-white/10 hover:border-ink/30 dark:hover:border-white/20",
      )}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-white dark:bg-surface-dark dark:border-white/10 px-6 py-14 lg:py-20 text-center">
      <p className="font-serif text-v-hlg-m font-normal text-ink dark:text-off-white">
        {title}
      </p>
      {hint ? (
        <p className="mt-2 max-w-sm text-v-body text-mid-grey dark:text-white/40 font-sans uppercase tracking-[0.1em]">
          {hint}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay asChild>
                <motion.div
                  className="fixed inset-0 z-[80] bg-black/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className="fixed left-1/2 top-1/2 z-[85] w-[320px] lg:w-[400px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white dark:bg-surface-dark dark:border-white/10 border border-line dark:border-white/10 p-5 lg:p-6"
                >
                  <Dialog.Title className="font-serif text-v-tsm font-semibold text-ink dark:text-off-white">
                    {title}
                  </Dialog.Title>
                  {description ? (
                    <Dialog.Description className="mt-2 text-v-body text-mid-grey dark:text-white/60">
                      {description}
                    </Dialog.Description>
                  ) : null}
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => onOpenChange(false)}
                      className="flex-1 rounded-md border border-line py-3 text-v-tsm text-ink dark:text-off-white dark:border-white/15 hover:bg-surface-low dark:hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onConfirm();
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex-1 rounded-md py-3 text-v-tsm font-bold text-white",
                        destructive ? "bg-error" : "bg-ink dark:bg-white dark:text-ink",
                      )}
                    >
                      {confirmLabel}
                    </button>
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute right-3 top-3 z-10 rounded-full bg-black/30 p-1 text-white hover:bg-black/50"
      aria-label="Close"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

// Vendor theme toggle helper — writes localStorage("vendor-dark") and applies
// the .dark class to <html> immediately. Confined to the vendor app.
export function applyVendorTheme(dark: boolean) {
  try {
    localStorage.setItem("vendor-dark", dark ? "true" : "false");
  } catch {}
  document.documentElement.classList.toggle("dark", dark);
}

export function useVendorTheme(): [boolean, (v: boolean) => void] {
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = (v: boolean) => {
    setDark(v);
    applyVendorTheme(v);
  };
  return [dark, toggle];
}
