"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Splash-only brand mark with the upper ornament on its own motion layer. */
export function SplashLogo() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="relative w-full"
      role="img"
      aria-label="Style Savant"
    >
      {/* In normal flow so the container keeps the logo's intrinsic size —
          absolute-only children collapse to 0x0 inside the centered flex
          parents on the splash screen. */}
      <img
        src="/style-s-logo-main.png"
        alt=""
        aria-hidden="true"
        className="block h-auto w-full brightness-0 invert"
      />

      <motion.img
        src="/style-s-logo-top-star.png"
        alt=""
        aria-hidden="true"
        className="absolute h-auto w-[38.87%] brightness-0 invert will-change-transform"
        style={{ left: "55.08%", top: "6.77%" }}
        animate={
          reduceMotion
            ? { opacity: 1 }
            : { rotate: 360, opacity: [0.92, 1, 0.92] }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                rotate: {
                  duration: 0.9,
                  ease: [0.77, 0, 0.175, 1],
                  repeat: Infinity,
                  repeatDelay: 0.6,
                },
                opacity: {
                  duration: 0.9,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.6,
                },
              }
        }
      />
    </div>
  );
}
