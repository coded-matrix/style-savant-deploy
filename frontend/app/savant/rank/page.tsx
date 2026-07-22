"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useApp } from "@/lib/consumer/store";
import { BottomNav } from "@/components/consumer/BottomNav";
import { compactCount } from "@/lib/consumer/format";
import { Button } from "@/components/consumer/Button";
import { SmartImage } from "@/components/consumer/SmartImage";
import { EmptyState } from "@/components/consumer/EmptyState";
import { Skeleton } from "@/components/consumer/Skeleton";
import { TopBar } from "@/components/consumer/TopBar";
import { BottomSheet } from "@/components/consumer/BottomSheet";
import type { Look, RankFilter } from "@/lib/consumer/types";
import { recommendationApi, type RankingWindow } from "@/lib/api/recommendation";

const FILTERS: RankFilter[] = ["Today", "This Week", "All Time"];

export default function RankPage() {
  const router = useRouter();
  const { votedLookIds, toggleVote, user, toast, cartCount, productById, logout } = useApp();
  const [filter, setFilter] = useState<RankFilter>("This Week");
  const [ranked, setRanked] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // Scroll container + per-card element refs, used to drive the mobile-only
  // "sway" animation below.
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const rankingWindow: RankingWindow =
      filter === "Today" ? "today" : filter === "This Week" ? "week" : "all";

    setLoading(true);
    recommendationApi
      .getRankings(rankingWindow)
      .then((items) => {
        if (!cancelled) setRanked(items);
      })
      .catch(() => {
        if (!cancelled) toast("Failed to load rankings.", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter, toast]);

  // Mobile-only TikTok-style feed: one look fills the screen and snaps into
  // place. The active card sits centered and straight; as you scroll to the
  // next, the outgoing card slides off to its own side (left/right, chosen
  // deterministically from its id) and the incoming one slides in from its
  // side — sideways, not straight up. Driven by each card's distance from the
  // screen centre, so the settled card is always straight. Skipped on desktop
  // and for reduced-motion users; only touches transform/opacity.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || typeof window === "undefined") return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isMobile || reduce) return;

    const dirFor = (id: string) => {
      let h = 0;
      for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
      return h % 2 === 0 ? 1 : -1;
    };
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    let raf = 0;
    const update = () => {
      raf = 0;
      const scRect = scroller.getBoundingClientRect();
      const vh = scRect.height || 1;
      const center = scRect.top + vh / 2;
      cardRefs.current.forEach((el, id) => {
        const r = el.getBoundingClientRect();
        // How far the card's centre is from the screen centre: 0 = active/straight,
        // ±1 = a full screen away (fully off to its side).
        const dist = clamp((r.top + r.height / 2 - center) / vh, -1, 1);
        // Dead-zone: the settled/active card sits perfectly straight (no drift,
        // tilt, scale, or fade) even if it's a few pixels off exact centre.
        if (Math.abs(dist) < 0.08) {
          el.style.transform = "";
          el.style.opacity = "";
          return;
        }
        const dir = dirFor(id);
        const driftX = dir * dist * r.width * 0.8; // slide sideways
        const tilt = dir * dist * 5; // deg — lean into the slide
        const scale = 1 - Math.min(Math.abs(dist), 1) * 0.1;
        const opacity = 1 - Math.min(Math.abs(dist), 1) * 0.35;
        el.style.transform = `translate3d(${driftX.toFixed(1)}px,0,0) rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(2);
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    cardRefs.current.forEach((el) => {
      el.style.willChange = "transform, opacity";
      el.style.transformOrigin = "center center";
    });
    scroller.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      cardRefs.current.forEach((el) => {
        el.style.transform = "";
        el.style.opacity = "";
        el.style.willChange = "";
      });
    };
  }, [ranked, loading]);

  const onFilter = (f: RankFilter) => {
    setFilter(f);
  };

  const onVote = (l: Look) => {
    if (l.isMine) return;
    if (user.isGuest) {
      toast("Sign in to vote.", "neutral");
      router.push("/savant/auth");
      return;
    }
    const had = votedLookIds.includes(l.id);
    toggleVote(l.id);
    setRanked((current) =>
      current
        .map((look) =>
          look.id === l.id
            ? { ...look, votes: Math.max(0, look.votes + (had ? -1 : 1)), votedByMe: !had }
            : look,
        )
        .sort((a, b) => b.votes - a.votes),
    );
    toast(had ? "Vote removed." : "You ranked this look!", had ? "neutral" : "success");
  };

  const tryThisFit = (l: Look) => {
    const p = productById(l.leadProductId);
    if (!p) {
      toast("Item no longer available.", "warn");
      return;
    }
    router.push(`/savant/studio?productId=${l.leadProductId}`);
  };

  return (
    <div className="flex h-full flex-col bg-off-white dark:bg-canvas-dark">
      {/* sticky header — centered title in coral per spec, back arrow + settings */}
      <TopBar
        title="Rank"
        titleClassName="text-ink dark:text-off-white"
        backHref="/savant/feed"
        className="shrink-0 bg-off-white dark:bg-canvas-dark"
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push("/savant/cart")}
              aria-label="Cart"
              className="grid h-9 w-9 place-items-center rounded-full text-ink dark:text-off-white hover:bg-surface-low dark:hover:bg-white/5 relative"
            >
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-ink text-[9px] font-bold text-white dark:bg-off-white dark:text-ink">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="grid h-9 w-9 place-items-center rounded-full text-ink dark:text-off-white hover:bg-surface-low dark:hover:bg-white/5"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          </div>
        }
      />
      <div className="z-30 shrink-0 bg-off-white dark:bg-canvas-dark px-page-x desktop-frame pb-3">
        <div className="no-scrollbar -mx-page-x md:mx-0 flex items-baseline gap-8 overflow-x-auto px-page-x md:px-0 max-w-[1200px] mx-auto">
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => onFilter(f)}
                className={cn(
                  "relative whitespace-nowrap py-2 text-[11px] uppercase tracking-[0.28em] transition-colors duration-300",
                  active
                    ? "text-ink dark:text-off-white"
                    : "text-mid-grey/70 dark:text-white/40 hover:text-ink dark:hover:text-off-white"
                )}
              >
                {f}
                {active && (
                  <motion.span
                    layoutId="rank-filter-underline"
                    className="absolute left-0 right-0 -bottom-px h-px bg-ink dark:bg-off-white"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="mx-auto max-w-2xl -mt-px h-px bg-line/60 dark:bg-white/10" />
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-card-x pb-28 md:pb-4 md:snap-none snap-y snap-mandatory desktop-frame"
      >
        <div className="mx-auto max-w-[1200px]">
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-card bg-white dark:bg-surface-dark">
                <Skeleton className="aspect-[4/5] w-full" />
                <div className="p-4">
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : ranked.length === 0 ? (
          <EmptyState
            illustration="podium"
            headline="No ranked looks yet. Be the first to post yours."
            cta={
              <Button variant="coral" full onClick={() => router.push("/savant/outfit")}>
                Create a Look
              </Button>
            }
          />
        ) : (
          <>
            {ranked.map((l, i) => {
              const voted = votedLookIds.includes(l.id) || l.votedByMe;
              const lead = productById(l.leadProductId);
              const itemGone = !lead;
              const isExpanded = expanded.has(l.id);
              return (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                <div
                  className="flex min-h-full snap-start snap-always items-center md:block md:min-h-0 md:py-3 first:md:pt-0"
                >
                <article
                  ref={(el) => {
                    if (el) cardRefs.current.set(l.id, el);
                    else cardRefs.current.delete(l.id);
                  }}
                  className="w-full flex flex-col overflow-hidden rounded-card bg-white dark:bg-surface-dark ring-1 ring-line/50 dark:ring-white/10"
                >
                  {/* image — aspect-[4/5] per reference */}
                  <div className="relative aspect-[4/5] w-full bg-surface">
                    <button
                      onClick={() =>
                        setExpanded((prev) => {
                          const n = new Set(prev);
                          n.has(l.id) ? n.delete(l.id) : n.add(l.id);
                          return n;
                        })
                      }
                      className="absolute inset-0"
                    >
                      <SmartImage src={l.image} alt={l.caption} seed={l.id} label="look" fill />
                    </button>
                    {/* rank badge — w-10 h-10 with white border */}
                    <span className="absolute left-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-ink font-display text-[20px] font-bold text-off-white dark:bg-off-white dark:text-ink">
                      {i + 1}
                    </span>
                    {/* gradient overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>

                  <div className="flex flex-col gap-3 p-4">
                    {/* user row + upvote */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => router.push("/savant/profile")}
                        className="flex items-center gap-3"
                      >
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-highest">
                          <SmartImage src={l.avatar} alt={l.username} seed={l.username} className="h-full w-full" />
                        </span>
                        <span className="font-display text-[18px] font-bold text-dark-grey dark:text-off-white">@{l.username}</span>
                      </button>
                      {l.isMine ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-low dark:bg-white/10 px-3 py-2 font-display text-[13px] font-bold text-mid-grey dark:text-white/60">
                          <span className="material-symbols-outlined text-[16px]">workspace_premium</span> Your Look
                        </span>
                      ) : (
                        <button
                          onClick={() => onVote(l)}
                          className={cn(
                            "flex items-center gap-1 rounded-full p-2 transition-colors",
                            voted ? "text-coral" : "text-mid-grey hover:bg-coral/10 hover:text-coral"
                          )}
                        >
                          <span className="material-symbols-outlined text-[20px]" style={voted ? { fontVariationSettings: "'FILL' 1" } : undefined}>workspace_premium</span>
                          <span className="font-display text-[13px] font-bold">{compactCount(l.votes)}</span>
                        </button>
                      )}
                    </div>

                    {/* caption */}
                    <p
                      className={cn(
                        "text-[14px] leading-[20px] text-ink-variant dark:text-white/70",
                        !isExpanded && "line-clamp-2"
                      )}
                    >
                      {l.caption}
                    </p>

                    {/* try this fit — rounded-lg per reference */}
                    {itemGone ? (
                      <span className="text-[13px] font-bold text-mid-grey dark:text-white/60">Item no longer available</span>
                    ) : (
                      <button
                        onClick={() => tryThisFit(l)}
                        className="mt-1 flex h-btn-md w-full items-center justify-center gap-2 rounded-lg bg-ink font-display text-[16px] font-bold text-off-white transition-all hover:opacity-90 active:scale-[0.98] dark:bg-off-white dark:text-ink"
                      >
                        <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                        Try This Fit
                      </button>
                    )}
                  </div>
                </article>
                </div>
                </motion.div>
              );
            })}
          </>
        )}
        </div>
      </div>

      <BottomSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" height={55}>
        <div className="divide-y divide-line dark:divide-white/10">
          <button onClick={() => { setSettingsOpen(false); toast("About Style Savant · Accra, Ghana · 2026", "neutral"); }} className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-low dark:hover:bg-white/5">
            <span className="material-symbols-outlined text-mid-grey dark:text-white/60">info</span>
            <span className="font-body text-sm font-bold text-ink dark:text-off-white">About Style Savant</span>
          </button>
          {!user.isGuest && (<>
            <button onClick={() => { setSettingsOpen(false); router.push("/savant/gallery"); }} className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-low dark:hover:bg-white/5">
              <span className="material-symbols-outlined text-mid-grey dark:text-white/60">photo_library</span>
              <span className="font-body text-sm font-bold text-ink dark:text-off-white">My Gallery</span>
            </button>
            <button onClick={() => { setSettingsOpen(false); setLogoutOpen(true); }} className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-error hover:bg-surface-low dark:hover:bg-white/5">
              <span className="material-symbols-outlined">logout</span>
              <span className="font-body text-sm font-bold">Log Out</span>
            </button>
          </>)}
        </div>
      </BottomSheet>

      <BottomSheet open={logoutOpen} onClose={() => setLogoutOpen(false)} height={38} bare fitContent footer={<div className="flex gap-3"><Button variant="greyOutline" className="flex-1" onClick={() => setLogoutOpen(false)}>Cancel</Button><Button variant="coral" className="flex-1" onClick={() => { logout(); router.replace("/savant"); }}>Log Out</Button></div>}>
        <div className="px-2 pt-4 text-center">
          <p className="font-display text-title-md text-ink dark:text-off-white">Log out?</p>
          <p className="mt-1 text-body-md text-mid-grey dark:text-white/60">You will need to sign in again.</p>
        </div>
      </BottomSheet>

      <BottomNav />
    </div>
  );
}
