"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { VendorProvider } from "@/context/VendorContext";
import { SidebarProvider, useSidebar } from "@/lib/vendor/sidebar-context";
import { SideNav } from "@/components/vendor/SideNav";
import { TopAppBar } from "@/components/vendor/TopAppBar";
import { BottomNavBar } from "@/components/vendor/BottomNavBar";
import { clearVendorToken, isVendorTokenValid } from "@/lib/api/token";

const PUBLIC_ROUTES = ["/vendor/login", "/vendor/signup", "/vendor/subscription"];

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (PUBLIC_ROUTES.includes(pathname)) {
      setReady(true);
      return;
    }
    if (!isVendorTokenValid()) {
      clearVendorToken();
      router.replace("/vendor/login");
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-bright dark:bg-canvas-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-mid-grey border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

function DarkModeRoot({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem("vendor-dark");
    const prefersDark =
      saved !== null
        ? saved === "true"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);
  return <>{children}</>;
}

function VendorMain({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <main
      className={`pt-0 pb-20 md:pb-0 min-h-screen transition-all duration-200 ${
        collapsed ? "md:ml-[68px]" : "md:ml-[280px]"
      }`}
    >
      <div className="w-full max-w-[1180px] mx-auto px-6 py-8 lg:px-10 lg:py-12 xl:px-14 xl:py-14">
        {children}
      </div>
    </main>
  );
}

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const onboarding =
    pathname === "/vendor/login" || pathname === "/vendor/signup" || pathname === "/vendor/subscription";

  if (onboarding) {
    return (
      <VendorProvider>
        <AuthGate>
          <DarkModeRoot>{children}</DarkModeRoot>
        </AuthGate>
      </VendorProvider>
    );
  }

  return (
    <VendorProvider>
      <AuthGate>
        <DarkModeRoot>
          <SidebarProvider>
            <div className="min-h-screen bg-surface-bright font-sans text-ink dark:bg-canvas-dark dark:text-off-white antialiased">
              <SideNav />
              <TopAppBar />
              <VendorMain>{children}</VendorMain>
              <BottomNavBar />
            </div>
          </SidebarProvider>
        </DarkModeRoot>
      </AuthGate>
    </VendorProvider>
  );
}
