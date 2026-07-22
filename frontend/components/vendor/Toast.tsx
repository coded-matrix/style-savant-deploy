"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { Toast } from "@/context/VendorContext";

export function ToastViewport({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-3 right-3 z-[100] flex w-[calc(100%-1.5rem)] max-w-sm flex-col gap-2 max-sm:bottom-20 max-sm:top-auto">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon =
            t.type === "success" ? CheckCircle2 : t.type === "error" ? AlertCircle : Info;
          const color =
            t.type === "success"
              ? "text-ink dark:text-off-white"
              : t.type === "error"
                ? "text-error"
                : "text-ink dark:text-off-white";
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              layout
              className="flex items-start gap-2 rounded-lg border border-line bg-white px-3 py-2.5 dark:border-white/10 dark:bg-surface-dark"
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
              <p className="flex-1 text-v-body text-ink dark:text-off-white">{t.message}</p>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss">
                <X className="h-4 w-4 text-mid-grey" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
