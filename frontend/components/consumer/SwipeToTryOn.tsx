"use client";

import { motion, useMotionValue, useTransform, animate, useReducedMotion, type PanInfo } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

interface SwipeToTryOnProps {
  onOpen: () => void;
  children: ReactNode;
  label?: string;
  /** Drag distance (px) past which try-on opens. */
  threshold?: number;
}

export function SwipeToTryOn({ onOpen, children, label = "Try on", threshold = 96 }: SwipeToTryOnProps) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const max = 260;
  const [showTooltip, setShowTooltip] = useState(false);

  // Reveal panel grows with the leftward drag.
  const panelWidth = useTransform(x, [-max, 0], [max, 0], { clamp: true });
  const panelOpacity = useTransform(x, [-max, -24, 0], [1, 1, 0]);
  const arrowX = useTransform(x, [-max, 0], [-8, 0], { clamp: true });

  // Looping nudge on the card itself.
  useEffect(() => {
    if (reduce) return;
    const controls = animate(x, [0, -14, 0], {
      duration: 1.6,
      repeat: 3,
      repeatDelay: 1.2,
      ease: "easeInOut",
    });
    return () => controls.stop();
  }, [reduce, x]);

  // Periodic tooltip that fades in and out.
  useEffect(() => {
    if (reduce) return;
    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    const show = () => {
      setShowTooltip(true);
      timeout = setTimeout(() => setShowTooltip(false), 2400);
    };

    // First show after 2s, then every 8s
    timeout = setTimeout(() => {
      show();
      interval = setInterval(show, 8000);
    }, 2000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [reduce]);

  // Hide tooltip as soon as user starts dragging.
  useEffect(() => {
    if (x.get() !== 0) setShowTooltip(false);
    const unsub = x.on("change", (v) => {
      if (v !== 0) setShowTooltip(false);
    });
    return unsub;
  }, [x]);

  const handleEnd = (_e: unknown, info: PanInfo) => {
    const committed = info.offset.x < -threshold || info.velocity.x < -600;
    animate(x, 0, { type: "spring", stiffness: 500, damping: 42 });
    if (committed) onOpen();
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Reveal panel — slides in from the right */}
      <motion.div
        style={{ width: panelWidth, opacity: panelOpacity }}
        className="pointer-events-none absolute inset-y-0 right-0 z-20 flex items-center justify-start overflow-hidden bg-ink/90 backdrop-blur-sm"
      >
        <span className="ml-6 flex items-center gap-2 whitespace-nowrap font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-white">
          <motion.span style={{ x: arrowX }} className="material-symbols-outlined text-[18px]">
            arrow_back
          </motion.span>
          {label}
        </span>
      </motion.div>

      {/* The product image / carousel — untouched */}
      <div className="relative z-10 h-full w-full">{children}</div>

      {/* Periodic tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-28 right-4 z-40 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-3 py-1.5 pointer-events-none"
        >
          <span className="material-symbols-outlined text-[14px] text-white/80">arrow_back</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/90">{label}</span>
        </motion.div>
      )}

      {/* Drag catcher — invisible, right 2/5 of the card */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -max, right: 0 }}
        dragElastic={{ left: 0.35, right: 0 }}
        style={{ x }}
        onDragEnd={handleEnd}
        className="absolute inset-y-0 right-0 z-30 w-2/5 cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
