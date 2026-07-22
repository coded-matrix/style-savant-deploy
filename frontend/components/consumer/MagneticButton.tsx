"use client";

import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useRef, type ComponentProps } from "react";

type MagneticButtonProps = Omit<ComponentProps<typeof motion.button>, "style"> & {
  radius?: number;
  strength?: number;
}

export function MagneticButton({
  children,
  radius = 60,
  strength = 0.18,
  className,
  onMouseMove,
  onMouseLeave,
  ...rest
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 260, damping: 22 });
  const y = useSpring(rawY, { stiffness: 260, damping: 22 });

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    onMouseMove?.(e);
    if (reduce) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    if (Math.hypot(dx, dy) < radius) {
      rawX.set(dx * strength);
      rawY.set(dy * strength);
    } else {
      rawX.set(0);
      rawY.set(0);
    }
  };

  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    onMouseLeave?.(e);
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x, y }}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
