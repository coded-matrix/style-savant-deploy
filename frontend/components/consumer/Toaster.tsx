"use client";

import { useApp } from "@/lib/consumer/store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Toaster() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className={cn(
              "pointer-events-auto flex w-full max-w-[420px] items-center gap-3 rounded-card px-4 py-3 text-sm font-bold text-off-white ring-1 ring-black/10 bg-ink"
            )}
          >
            <span className="shrink-0">
              {t.tone === "error" ? (
                <span className="material-symbols-outlined text-[20px]">close</span>
              ) : t.tone === "warn" ? (
                <span className="material-symbols-outlined text-[20px]">exclamation</span>
              ) : t.tone === "success" ? (
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>check</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">info</span>
              )}
            </span>
            <span className="flex-1 font-display">{t.message}</span>
            <button onClick={() => dismissToast(t.id)} className="shrink-0 opacity-80 hover:opacity-100">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
