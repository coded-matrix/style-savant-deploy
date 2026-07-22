"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/consumer/store";
import {
  hasStudioItems,
  loadStudioDraft,
  STUDIO_DRAFT_EVENT,
  STUDIO_DRAFT_KEY,
} from "@/lib/consumer/studio-draft";

/**
 * Floating "Continue your outfit →" prompt shown on any /savant route (except
 * the Studio itself) while an in-progress studio draft exists. Tapping it
 * returns the user to the Studio with their outfit intact.
 *
 * While a virtual try-on is rendering (or has just finished) it also reflects
 * that state — so a user who left for the feed mid-render is pulled back with
 * an attention animation once their look is ready.
 */
export function StudioResumeButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { tryOn, tryOnJustCompleted } = useApp();
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const check = () => setHasDraft(hasStudioItems(loadStudioDraft()));
    check();

    const onStorage = (e: StorageEvent) => {
      if (e.key === STUDIO_DRAFT_KEY) check();
    };
    window.addEventListener(STUDIO_DRAFT_EVENT, check);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(STUDIO_DRAFT_EVENT, check);
      window.removeEventListener("storage", onStorage);
    };
  }, [pathname]);

  const rendering = tryOn.status === "rendering";
  const ready = tryOnJustCompleted && tryOn.status === "done";

  // Never show on the studio page itself or the onboarding/splash page.
  if (pathname === "/savant" || pathname?.startsWith("/savant/studio")) return null;
  // Show when there's a resumable draft, or an active/just-finished render.
  if (!hasDraft && !rendering && !ready) return null;

  return (
    <div className="fixed bottom-[92px] left-1/2 z-40 -translate-x-1/2">
      {/* Pulsing halo to draw the eye when a look is ready. */}
      {ready && (
        <span className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
      )}
      <button
        onClick={() => router.push("/savant/studio")}
        className={cn(
          "relative flex items-center gap-2 rounded-full border px-4 py-2.5 text-label-bold text-white shadow-lg shadow-black/20 active:scale-95 transition-transform backdrop-blur-md",
          ready
            ? "border-white/40 bg-ink dark:bg-white/25 animate-bounce"
            : "border-white/25 bg-black/30 dark:bg-white/15",
        )}
      >
        {rendering ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Rendering your look…
          </>
        ) : ready ? (
          <>
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Your look is ready
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px]">checkroom</span>
            Continue your outfit
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </>
        )}
      </button>
    </div>
  );
}
