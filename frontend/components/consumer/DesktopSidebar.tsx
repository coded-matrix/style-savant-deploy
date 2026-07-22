"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useApp } from "@/lib/consumer/store";
import { NumberFlip } from "./NumberFlip";

const TABS = [
  { href: "/savant/feed", label: "Feed", icon: "style" },
  { href: "/savant/explore", label: "Explore", icon: "search" },
  { href: "/savant/rank", label: "Rank", icon: "leaderboard" },
  { href: "/savant/profile", label: "Profile", icon: "person" },
] as const;

export function DesktopSidebar() {
  const pathname = usePathname();
  const { cartCount } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);

  return (
    <nav
      className={cn(
        "hidden md:flex flex-col h-[100dvh] border-r border-line dark:border-white/10 sticky top-0 left-0 pt-16 pb-12 transition-all duration-[400ms]",
        collapsed ? "w-[72px]" : "w-[240px]",
        logoHovered ? "bg-surface-low dark:bg-white/[0.03]" : "bg-surface-lowest dark:bg-canvas-dark"
      )}
    >
      {/* Logo / Collapse toggle */}
      <div
        className={cn(
          "mb-16 flex items-center",
          collapsed ? "px-4 justify-center" : "px-8"
        )}
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => setLogoHovered(false)}
      >
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "grid place-items-center rounded-lg hover:bg-surface-low dark:hover:bg-white/5 transition-colors cursor-pointer",
            collapsed ? "h-9 w-9" : "h-12"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {logoHovered ? (
            <span className="material-symbols-outlined text-[20px] text-mid-grey dark:text-white/60">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
          ) : (
            <img
              src="/style-s-logo-transparent.png"
              alt="Style Savant"
              className={cn(
                "object-contain brightness-0 dark:invert transition-all",
                collapsed ? "h-8 w-8" : "h-10 w-auto"
              )}
            />
          )}
        </button>
      </div>

      {/* Nav links */}
      <ul className="flex-1 flex flex-col gap-0 px-0">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <li key={tab.href} className="relative">
              <Link
                href={tab.href}
                title={collapsed ? tab.label : undefined}
                className={cn(
                  "relative flex items-center gap-4 py-3 transition-all duration-200 group",
                  collapsed ? "justify-center px-0" : "px-8",
                  active
                    ? "text-ink dark:text-off-white"
                    : "text-mid-grey/60 dark:text-white/40 hover:text-mid-grey dark:hover:text-white/60"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="active-nav-marker"
                    className="absolute left-3 h-1.5 w-1.5 bg-ink dark:bg-off-white"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <span
                  className={cn(
                    "material-symbols-outlined text-[18px] shrink-0",
                    active && "font-variation-settings-['FILL'_1]"
                  )}
                >
                  {tab.icon}
                </span>
                {!collapsed && (
                  <span className="text-[11px] uppercase tracking-[0.24em] font-medium link-wipe">
                    {tab.label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Cart */}
      <div className={cn("mt-auto", collapsed ? "px-4" : "px-8")}>
        <Link
          href="/savant/cart"
          title={collapsed ? "Cart" : undefined}
          className={cn(
            "flex items-center gap-4 py-3 text-mid-grey/60 dark:text-white/40 hover:text-mid-grey dark:hover:text-white/60 transition-colors duration-[240ms] group",
            collapsed && "justify-center"
          )}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">
            shopping_bag
          </span>
          {!collapsed && (
            <span className="text-[11px] uppercase tracking-[0.24em] font-medium">
              Cart
              {cartCount > 0 && (
                <span className="tabular-nums">
                  {" "}·{" "}
                  <NumberFlip value={String(cartCount).padStart(2, "0")} />
                </span>
              )}
            </span>
          )}
        </Link>
      </div>

      {/* Season marginalia */}
      {!collapsed && (
        <div
          className="px-8 pt-8 pb-2"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          <span className="text-[10px] tracking-[0.32em] text-mid-grey dark:text-white/30">
            SPRING · 2026
          </span>
        </div>
      )}
    </nav>
  );
}
