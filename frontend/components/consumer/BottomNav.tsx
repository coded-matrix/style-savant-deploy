"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const TABS = [
  { href: "/savant/feed", label: "Feed", icon: "style" },
  { href: "/savant/explore", label: "Explore", icon: "search" },
  { href: "/savant/rank", label: "Rank", icon: "leaderboard" },
  { href: "/savant/profile", label: "Profile", icon: "person" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="absolute bottom-0 w-full z-50 rounded-t-xl bg-white/95 backdrop-blur-sm border-t border-line/60 dark:bg-surface-dark/95 dark:border-white/10 md:hidden">
      <ul className="flex justify-around items-center px-4 py-2 w-full max-w-2xl mx-auto">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <li key={tab.href} className="flex-1 relative">
              <Link
                href={tab.href}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1",
                  active ? "text-ink dark:text-off-white" : "text-mid-grey dark:text-white/40"
                )}
              >
                <span className="material-symbols-outlined text-[20px] mb-1">
                  {tab.icon}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.24em]">{tab.label}</span>
                {active && (
                  <motion.span
                    layoutId="active-nav-marker"
                    className="absolute -bottom-0.5 h-px w-8 bg-ink dark:bg-off-white"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
