"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAdminToken } from "@/lib/api/token";
import {
  LayoutDashboard,
  Users,
  Coins,
  ShoppingCart,
  Shield,
  LogOut,
  Clapperboard,
} from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/tokens", label: "Tokens", icon: Coins },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/video-requests", label: "Video Requests", icon: Clapperboard },
];

const PUBLIC_ROUTES = ["/admin/login"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (PUBLIC_ROUTES.includes(pathname)) {
      setReady(true);
      return;
    }
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "admin") {
        router.replace("/admin/login");
        return;
      }
    } catch {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-bright dark:bg-canvas-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-mid-grey border-t-transparent" />
      </div>
    );
  }

  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-surface-bright font-sans text-ink dark:bg-canvas-dark dark:text-off-white antialiased">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-line dark:border-white/10 bg-white dark:bg-surface-dark">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-line dark:border-white/10">
          <Shield className="h-5 w-5 text-teal dark:text-off-white" />
          <span className="text-v-title font-bold text-ink dark:text-white">Admin</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-v-body font-medium transition-colors",
                  active
                    ? "bg-teal/10 text-teal dark:bg-off-white/10 dark:text-off-white"
                    : "text-mid-grey hover:bg-surface-low dark:hover:bg-white/5 hover:text-ink dark:hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-line dark:border-white/10">
          <Link
            href="/vendor/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-v-body font-medium text-mid-grey hover:bg-surface-low dark:hover:bg-white/5 hover:text-ink dark:hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Back to Vendor
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 flex items-center gap-3 border-b border-line dark:border-white/10 bg-white dark:bg-surface-dark px-4 py-3">
        <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation menu" className="text-ink dark:text-white">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Shield className="h-5 w-5 text-teal dark:text-off-white" />
        <span className="text-v-title font-bold text-ink dark:text-white">Admin</span>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-white dark:bg-surface-dark p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-3 py-2 mb-2 border-b border-line dark:border-white/10 pb-4">
              <Shield className="h-5 w-5 text-teal dark:text-off-white" />
              <span className="text-v-title font-bold text-ink dark:text-white">Admin</span>
            </div>
            <nav className="space-y-1">
              {NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-v-body font-medium transition-colors",
                      active
                        ? "bg-teal/10 text-teal dark:bg-off-white/10 dark:text-off-white"
                        : "text-mid-grey hover:bg-surface-low dark:hover:bg-white/5",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 pt-4 border-t border-line dark:border-white/10">
              <Link
                href="/vendor/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-v-body font-medium text-mid-grey hover:bg-surface-low dark:hover:bg-white/5 transition-colors"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                Back to Vendor
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
