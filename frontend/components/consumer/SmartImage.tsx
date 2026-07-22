"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Deterministic monochrome gradient from a seed string (editorial greyscale).
function gradientFor(seed: string): string {
  const palettes = [
    ["#2B2B2B", "#141414", "#000000"], // graphite → black
    ["#E4E1DB", "#B9B5AD", "#4A4844"], // stone → graphite
    ["#F4F3F0", "#C9C6BF", "#3A3A38"], // bone → charcoal
    ["#8A867F", "#4A4844", "#0A0A0A"], // mid grey → near-black
    ["#DEDAD3", "#8A867F", "#1A1A18"], // light stone → ink
    ["#3A3A38", "#6E6B65", "#141414"], // charcoal → graphite → ink
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const p = palettes[h % palettes.length];
  const a = 20 + (h % 40);
  return `linear-gradient(${a}deg, ${p[0]} 0%, ${p[1]} 45%, ${p[2]} 100%)`;
}

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  seed?: string;
  /** show alt text initial on fallback */
  label?: string;
  rounded?: string;
  fill?: boolean;
}

export function SmartImage({
  src,
  alt,
  className,
  seed,
  label,
  fill,
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);
  const fallbackSeed = seed ?? alt ?? src;
  const initial = (label ?? alt ?? "?").trim().charAt(0) || "S";

  if (fill) {
    // absolute-fill layer (e.g. backdrop/model layer)
    return (
      <div className={cn("absolute inset-0 overflow-hidden", className)}>
        <div
          className="absolute inset-0"
          style={{ background: gradientFor(fallbackSeed) }}
        />
        {!failed && (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className="relative h-full w-full object-cover"
          />
        )}
        {failed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-6xl font-bold text-white/80">
              {initial}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={failed ? { background: gradientFor(fallbackSeed) } : undefined}
    >
      {!failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="font-display text-5xl font-bold text-white/80">
            {initial}
          </span>
        </div>
      )}
    </div>
  );
}
