"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/consumer/store";
import { SplashLogo } from "@/components/consumer/SplashLogo";
import { OnboardingFlow } from "@/components/consumer/OnboardingFlow";

// Minimum time the splash is shown for branding. Short — we don't want to
// feel slow.
const MIN_SPLASH_MS = 600;
// Hard ceiling so the splash can never hang (e.g. a hung backend that
// blocks the hydration effect).
const MAX_SPLASH_MS = 3000;

export default function SplashPage() {
  const router = useRouter();
  const { isReturning } = useApp();
  const [route, setRoute] = useState<"splash" | "onboarding">("splash");

  useEffect(() => {
    router.prefetch("/savant/feed");

    // Mark the splash eligible to advance after MIN_SPLASH_MS for branding.
    const minTimer = setTimeout(() => {
      // If we already know isReturning by now, route immediately. Otherwise
      // wait — the effect below will route once isReturning flips.
      // (isReturning is determined in the store's hydration effect, which
      // reads from localStorage synchronously and from the JWT likewise.)
    }, MIN_SPLASH_MS);

    // Hard timeout — never let the splash spin forever.
    const maxTimer = setTimeout(() => {
      // If we still don't know, fall through to onboarding rather than
      // hang the user on a splash screen.
      setRoute((current) => (current === "splash" ? "onboarding" : current));
    }, MAX_SPLASH_MS);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, [router]);

  useEffect(() => {
    // Wait at least MIN_SPLASH_MS for the splash to be visible.
    const id = setTimeout(() => {
      if (isReturning) {
        router.replace("/savant/feed");
      } else {
        setRoute("onboarding");
      }
    }, MIN_SPLASH_MS);
    return () => clearTimeout(id);
  }, [isReturning, router]);

  if (route === "onboarding") {
    return (
      <OnboardingFlow
        onComplete={() => {
          router.replace("/savant/feed");
        }}
      />
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-teal">
      {/* Main content canvas */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-page-x">
        {/* Brand mark: only the upper star rotates. */}
        <div className="flex w-[45%] max-w-[240px] justify-center">
          <SplashLogo />
        </div>
      </div>

      {/* Loading indicator area (bottom 10%) */}
      <div className="absolute bottom-0 z-10 flex h-[10%] w-full items-center justify-center gap-2 pb-6">
        <span className="h-3 w-3 rounded-full bg-coral animate-pulse-dot-1" />
        <span className="h-3 w-3 rounded-full bg-coral animate-pulse-dot-2" />
        <span className="h-3 w-3 rounded-full bg-coral animate-pulse-dot-3" />
      </div>
    </div>
  );
}
