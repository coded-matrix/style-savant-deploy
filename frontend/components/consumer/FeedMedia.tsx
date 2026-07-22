"use client";

import { useEffect, useRef, useState } from "react";
import { SmartImage } from "@/components/consumer/SmartImage";

interface FeedMediaProps {
  image: string;
  videoUrl?: string | null;
  alt: string;
  seed: string;
}

/**
 * Full-frame feed media. Videos autoplay only while their card is visible,
 * remain muted by default for browser compatibility, and fall back cleanly
 * to the required poster image when the video cannot load.
 */
export function FeedMedia({ image, videoUrl, alt, seed }: FeedMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.65 && !reduceMotion) {
          void video.play().catch(() => setPlaying(false));
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.65, 1] },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [videoUrl]);

  if (!videoUrl || failed) {
    return <SmartImage src={image} alt={alt} seed={seed} label={alt} fill />;
  }

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={image}
        aria-label={alt}
        className="h-full w-full object-cover"
        muted={muted}
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
        onClick={togglePlayback}
      />

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setMuted((value) => !value);
        }}
        className="absolute left-3 top-24 z-40 grid size-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label={muted ? "Unmute video" : "Mute video"}
      >
        <span className="material-symbols-outlined text-[22px]">
          {muted ? "volume_off" : "volume_up"}
        </span>
      </button>

      {!playing && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            togglePlayback();
          }}
          className="absolute left-1/2 top-1/2 z-40 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Play video"
        >
          <span className="material-symbols-outlined text-3xl">play_arrow</span>
        </button>
      )}
    </div>
  );
}
