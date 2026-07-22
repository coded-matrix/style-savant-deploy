"use client";

import { useReducedMotion } from "framer-motion";

export function FilmGrain() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ mixBlendMode: "overlay", opacity: 0.035 }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="ss-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.08  0 0 0 0 0.08  0 0 0 0.85 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ss-grain)" />
      </svg>
    </div>
  );
}
