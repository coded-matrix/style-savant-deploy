"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SPRING } from "@/lib/consumer/motion";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** sticky bottom action area */
  footer?: React.ReactNode;
  /** height as percentage of the device */
  height?: number; // 0-100
  /** lock dismiss (e.g. during purchase) */
  lockDismiss?: boolean;
  /** hide the default header (handle still shown) */
  bare?: boolean;
  /** render above another sheet (stacked) */
  stacked?: boolean;
  /** use max-height instead of fixed height — sheet shrinks to fit content */
  fitContent?: boolean;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  height = 65,
  lockDismiss = false,
  bare = false,
  stacked = false,
  fitContent = false,
}: BottomSheetProps) {
  const dragY = React.useRef(0);
  const startY = React.useRef<number | null>(null);
  const [offset, setOffset] = React.useState(0);

  // lock body scroll while open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dismiss = React.useCallback(() => {
    if (lockDismiss) return;
    onClose();
  }, [lockDismiss, onClose]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (lockDismiss) return;
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current == null) return;
    dragY.current = Math.max(0, e.clientY - startY.current);
    setOffset(dragY.current);
  };
  const onPointerUp = () => {
    if (dragY.current > 120) dismiss();
    setOffset(0);
    dragY.current = 0;
    startY.current = null;
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "absolute inset-0 z-[100] flex flex-col justify-end",
            stacked && "z-[110]"
          )}
        >
          {/* backdrop dim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={dismiss}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRING.snap}
            className="relative flex flex-col rounded-t-sheet bg-white ring-1 ring-line dark:bg-surface-dark dark:ring-white/10"
            style={{
              ...(fitContent
                ? { maxHeight: `${height}%` }
                : { height: `${height}%` }),
              ...(offset > 0 ? { y: offset } : {}),
            }}
          >
            {/* drag handle */}
            <div
              className="flex shrink-0 cursor-grab justify-center pt-2.5 active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <span className="h-1 w-10 rounded-pill bg-line dark:bg-white/20" />
            </div>

            {!bare && (
              <div className="flex shrink-0 items-center justify-between px-page-x pb-1 pt-2">
                <h2 className="font-serif text-headline-md text-ink dark:text-off-white">{title}</h2>
                <button
                  onClick={dismiss}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-full text-mid-grey dark:text-white/60 hover:bg-surface-low dark:hover:bg-white/10"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            )}

            <div className="no-scrollbar flex-1 overflow-y-auto px-page-x pb-4">
              {children}
            </div>

            {footer && (
              <div className="shrink-0 border-t border-line bg-white dark:border-white/10 dark:bg-surface-dark px-page-x pt-3 pb-5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
