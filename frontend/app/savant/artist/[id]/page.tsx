"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/consumer/store";
import { motion } from "framer-motion";
import { ghs } from "@/lib/consumer/format";
import { SmartImage } from "@/components/consumer/SmartImage";
import { Button } from "@/components/consumer/Button";
import { BackdropTile } from "@/components/consumer/BackdropTile";
import { BackdropPicker } from "@/components/consumer/BackdropPicker";
import { BottomSheet } from "@/components/consumer/BottomSheet";
import { TopBar } from "@/components/consumer/TopBar";
import { BottomNav } from "@/components/consumer/BottomNav";

export default function ArtistPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { ownedBackdropIds, toast, artistById, backdropsByArtist } = useApp();
  const artist = artistById(params.id);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [bpOpen, setBpOpen] = useState(false);
  const [artSheet, setArtSheet] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  if (!artist) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-white dark:bg-canvas-dark px-8 text-center">
        <p className="font-display text-headline-md text-ink dark:text-off-white">This artist is no longer on Style Savant.</p>
        <Button variant="tealOutline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const backdrops = backdropsByArtist(artist.id);

  return (
    <div className="flex h-full flex-col bg-surface-bright dark:bg-canvas-dark">
      {/* Top Header Bar */}
      <TopBar
        title="Style Savant"
        titleClassName="text-ink dark:text-off-white font-medium text-[11px] uppercase tracking-[0.28em]"
        right={
          <button
            onClick={() => toast("Settings", "neutral")}
            aria-label="Settings"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-low dark:hover:bg-white/10 text-ink dark:text-off-white"
          >
            <span className="material-symbols-outlined text-[24px]">settings</span>
          </button>
        }
      />

      <div className="no-scrollbar flex-1 overflow-y-auto pb-4">
        <div className="mx-auto max-w-[1200px]">
        {/* Tall Hero Section */}
        <div className="relative h-[320px] w-full overflow-hidden">
          <SmartImage src={artist.portrait} alt={artist.name} seed={artist.id} label={artist.name} fill />
          {/* Saturated linear gradient matching visual reference */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          
          {/* Overlays */}
          <div className="absolute bottom-5 left-page-x right-page-x text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block rounded-pill bg-ink px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-off-white dark:bg-off-white dark:text-ink">
                Featured Artist
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-white/90">
                <span className="material-symbols-outlined text-[13px] text-white/90">location_on</span> {artist.location}
              </span>
            </div>
            
            <h1 className="font-display text-[26px] font-bold tracking-tight text-white leading-tight">
              {artist.name}
            </h1>
            
            <p className="mt-1 text-[13px] leading-relaxed text-white/85 max-w-[340px]">
              {artist.tagline ?? "Digital native exploring the intersection of traditional textile patterns and modern generative design."}
            </p>
          </div>
        </div>

        <div className="px-page-x md:px-16 lg:px-24 pt-4">
          {/* Stats Bar with Follow Button */}
          <div className="flex items-center justify-between py-2.5 border-b border-line/60 dark:border-white/10">
            <div className="flex items-center gap-8">
              <div>
                <span className="block text-headline-sm font-bold text-ink dark:text-off-white leading-tight">
                  {artist.backdropsCount}
                </span>
                <span className="block text-[11px] font-bold text-mid-grey dark:text-white/60 uppercase tracking-wider">
                  Backdrops
                </span>
              </div>
              <div>
                <span className="block text-headline-sm font-bold text-ink dark:text-off-white leading-tight">
                  {artist.followersCount ?? "8.4k"}
                </span>
                <span className="block text-[11px] font-bold text-mid-grey dark:text-white/60 uppercase tracking-wider">
                  Followers
                </span>
              </div>
            </div>

            <Button
              variant={isFollowing ? "greyOutline" : "coral"}
              size="sm"
              onClick={() => {
                setIsFollowing((f) => !f);
                toast(isFollowing ? "Unfollowed artist" : "Following artist", "success");
              }}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>

          {/* Saturated Biography with Read More */}
          <div className="mt-4">
            <p className={`text-body-md text-ink-variant dark:text-white/70 leading-relaxed ${!bioExpanded && "line-clamp-3"}`}>
              {artist.bio}
            </p>
            <button
              onClick={() => setBioExpanded((e) => !e)}
              className="mt-1 text-[11px] uppercase tracking-[0.24em] link-wipe text-ink dark:text-off-white font-medium block"
            >
              {bioExpanded ? "Read less" : "Read more"}
            </button>
          </div>

          {/* Exclusive Backdrops Available Pill */}
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-pill bg-ink/5 dark:bg-white/10 px-4 py-1.5 text-[12px] font-bold text-ink dark:text-off-white ring-1 ring-ink/10 dark:ring-white/10">
              <span className="material-symbols-outlined text-[15px]">wallpaper</span>
              {artist.backdropsCount} Exclusive Backdrops Available
            </div>
          </div>

          {/* Backdrops Header with Filter */}
          <div className="mt-6 flex items-center justify-between">
            <h2 className="font-display text-title-md font-bold text-ink dark:text-off-white">Backdrops</h2>
            <button
              onClick={() => setBpOpen(true)}
              aria-label="Filter Backdrops"
              className="grid h-8 w-8 place-items-center rounded-full bg-mid-grey/10 dark:bg-white/10 text-ink dark:text-off-white hover:bg-mid-grey/20 dark:hover:bg-white/15"
            >
              <span className="material-symbols-outlined text-[19px]">tune</span>
            </button>
          </div>

          {/* Backdrops Grid */}
          {backdrops.length === 0 ? (
            <p className="mt-3 text-body-md text-mid-grey dark:text-white/60">Backdrops coming soon from this artist.</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {backdrops.map((b, index) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                <BackdropTile
                  backdrop={b}
                  owned={ownedBackdropIds.includes(b.id)}
                  onClick={() => setBpOpen(true)}
                />
                </motion.div>
              ))}
            </div>
          )}

          {/* Original Works Grid */}
          {artist.originalWorks && artist.originalWorks.length > 0 && (
            <div className="mt-7">
              <h2 className="font-display text-title-md font-bold text-ink dark:text-off-white">Original Works</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {artist.originalWorks.map((w, index) => (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                  <button
                    onClick={() => setArtSheet(w.id)}
                    className="text-left group"
                  >
                    <span className="block aspect-[3/4] w-full overflow-hidden rounded-[16px] border border-line/60 dark:border-white/10 bg-white dark:bg-surface-dark p-1.5 ring-1 ring-line/50 dark:ring-white/10 group-hover:ring-ink/30 transition-shadow">
                      <SmartImage src={w.image} alt={w.title} seed={w.id} className="h-full w-full rounded-[12px] object-cover" />
                    </span>
                    <span className="mt-2 block truncate font-display text-[14px] font-bold text-ink dark:text-off-white">{w.title}</span>
                    <span className="block text-[12px] text-mid-grey dark:text-white/60">{w.medium ?? "Digital Art"}</span>
                  </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Sticky CTA Bottom Bar with custom padding */}
      <div className="z-30 shrink-0 border-t border-line dark:border-white/10 bg-white dark:bg-surface-dark px-page-x md:px-16 lg:px-24 pt-3 pb-8">
        <Button variant="coral" full onClick={() => setBpOpen(true)} className="py-3.5 text-sm">
          <span className="material-symbols-outlined mr-2 text-[18px]">wallpaper</span>
          Use a Backdrop
        </Button>
      </div>

      {/* Global Navigation Bar */}
      <BottomNav />

      <BackdropPicker open={bpOpen} onClose={() => setBpOpen(false)} artistId={artist.id} onApply={() => toast("Backdrop applied.", "success")} />

      <BottomSheet open={!!artSheet} onClose={() => setArtSheet(null)} title="Original Work" fitContent>
        {artSheet &&
          (() => {
            const w = artist.originalWorks!.find((x) => x.id === artSheet)!;
            return (
              <div className="space-y-4">
                <div className="relative aspect-square w-full overflow-hidden rounded-[16px]">
                  <SmartImage src={w.image} alt={w.title} seed={w.id} label={w.title} fill />
                </div>
                <div>
                  <h3 className="font-display text-title-md font-bold text-ink dark:text-off-white">{w.title}</h3>
                  <p className="text-[13px] text-mid-grey dark:text-white/60">{w.medium ?? "Digital Art"}</p>
                  <p className="mt-1 font-serif text-2xl font-normal text-ink dark:text-off-white">{ghs(w.priceGHS)}</p>
                  <p className="mt-2 text-body-md text-ink-variant dark:text-white/70 leading-relaxed">
                    A one-of-a-kind original masterpiece by {artist.name}. Enquire to purchase.
                  </p>
                </div>
                <Button variant="coral" full onClick={() => {
                  toast("Enquiry sent to artist.", "success");
                  setArtSheet(null);
                }}>
                  Enquire to Buy
                </Button>
              </div>
            );
          })()}
      </BottomSheet>
    </div>
  );
}
