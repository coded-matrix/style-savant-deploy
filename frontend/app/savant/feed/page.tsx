"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useApp } from "@/lib/consumer/store";
import { type FeedPost } from "@/lib/consumer/dummy/feed";
import { recommendationApi } from "@/lib/api/recommendation";
import { ghs } from "@/lib/consumer/format";
import { FeedMedia } from "@/components/consumer/FeedMedia";
import { SwipeToTryOn } from "@/components/consumer/SwipeToTryOn";
import { CurtainReveal } from "@/components/consumer/CurtainReveal";
import { FadeIn } from "@/components/consumer/FadeIn";
import { SwipeTooltip } from "@/components/consumer/SwipeTooltip";
import { Logo } from "@/components/consumer/Logo";
import { BottomNav } from "@/components/consumer/BottomNav";
import { EASE } from "@/lib/consumer/motion";

const BATCH_SIZE = 5;

export default function FeedPage() {
  const router = useRouter();
  const { toast, cartCount, productById, user, addToCart } = useApp();
  const [loading, setLoading] = useState(true);

  const [visiblePosts, setVisiblePosts] = useState<FeedPost[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const cursorRef = useRef<number | null>(null);
  const cycleRef = useRef(0);

  useEffect(() => {
    recommendationApi
      .getFeed(undefined, BATCH_SIZE)
      .then(({ items, nextCursor }) => {
        const loaded = items
          .map((look, i) => {
            const product = productById(look.leadProductId);
            if (!product) return null;
            return {
              id: `${look.id}__c${cycleRef.current}_${i}`,
              image: look.image,
              videoUrl: look.videoUrl,
              likes: look.votes,
              rankCount: look.votes,
              product,
            };
          })
          .filter(Boolean) as FeedPost[];

        cursorRef.current = nextCursor;
        if (nextCursor === null) {
          cycleRef.current = cycleRef.current + 1;
        }
        setVisiblePosts(loaded);
      })
      .catch(() => {
        toast("Failed to load feed.", "error");
      })
      .finally(() => setLoading(false));
  }, [productById, toast]);

  useEffect(() => {
    // Reset to the top post. The browser restores the container's previous
    // scroll position after a reload, and it does so *after* this effect
    // first runs — so re-assert on the next frames until it sticks.
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    const raf = requestAnimationFrame(() => {
      el.scrollTop = 0;
    });
    const timer = setTimeout(() => {
      el.scrollTop = 0;
    }, 100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [loading]);

  const appendMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;

    try {
      const currentCursor = cursorRef.current;
      const { items, nextCursor } = await recommendationApi.getFeed(
        currentCursor ?? undefined,
        BATCH_SIZE,
      );

      const cycle = cycleRef.current;
      const newPosts = items
        .map((look, i) => {
          const product = productById(look.leadProductId);
          if (!product) return null;
          return {
            id: `${look.id}__c${cycle}_${i}`,
            image: look.image,
            videoUrl: look.videoUrl,
            likes: look.votes,
            rankCount: look.votes,
            product,
          };
        })
        .filter(Boolean) as FeedPost[];

      if (nextCursor === null) {
        cursorRef.current = null;
        cycleRef.current = cycle + 1;
      } else {
        cursorRef.current = nextCursor;
      }

      setVisiblePosts((prev) => [...prev, ...newPosts]);
    } catch {
      toast("Failed to load more.", "error");
    } finally {
      setTimeout(() => {
        loadingMoreRef.current = false;
      }, 400);
    }
  }, [productById, toast]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          appendMore();
        }
      },
      {
        root: scrollRef.current,
        rootMargin: "0px 0px 300px 0px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [appendMore, loading]);

  const [triedOn, setTriedOn] = useState<Set<string>>(new Set());

  const openTryOn = (post: FeedPost) => {
    if (user.isGuest) {
      toast("Please log in to use the try-on feature.", "neutral");
      router.push("/savant/auth");
      return;
    }
    if (!user.fitProfile?.photo) {
      toast("Please upload a photo of yourself to use the try-on feature.", "neutral");
      router.push(
        `/savant/profile/upload?returnUrl=${encodeURIComponent(
          `/savant/studio?productId=${post.product.id}`
        )}`
      );
    } else {
      router.push(`/savant/studio?productId=${post.product.id}`);
    }
  };

  const addPostToCart = (post: FeedPost) => {
    const product = productById(post.product.id);
    if (!product) {
      toast("This product is currently unavailable.", "error");
      return;
    }

    const availableSize = product.sizes.includes("M") && product.stockBySize?.M !== false
      ? "M"
      : product.sizes.find((size) => product.stockBySize?.[size] !== false);

    if (product.soldOut || !availableSize) {
      toast(`${product.name} is currently sold out.`, "error");
      return;
    }

    addToCart(product.id, availableSize, product.colors?.[0]?.name);
    toast(`${product.name} added to your cart.`, "success");
  };

  const toggleTriedOn = (postId: string) => {
    setTriedOn((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const onShareNative = async (post: FeedPost) => {
    const p = productById(post.product.id);
    if (!p) return;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/savant/product/${p.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${p.name} — Style Savant`, text: `Check out ${p.name}`, url });
      } catch {
        // user cancelled
      }
    } else {
      toast("Share link copied.", "success");
    }
  };

  if (loading) {
    return (
      <div className="relative flex h-full flex-col bg-studio-black font-body text-body-md">
        <div className="flex flex-1 items-center justify-center">
          <div className="shimmer h-full w-full bg-dark-grey md:h-[92%] md:w-auto md:aspect-[9/16] md:rounded-2xl" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-studio-black font-body text-body-md">
      <div className="absolute top-0 w-full z-40 flex justify-between items-center px-page-x pt-[calc(env(safe-area-inset-top,0px)+24px)] pb-12 pointer-events-none md:hidden bg-gradient-to-b from-black/40 via-black/10 to-transparent">
        <Link href="/savant" className="pointer-events-auto">
          <Logo mono="light" imgClassName="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link
            href="/savant/cart"
            className="relative hover:opacity-80 transition-opacity flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-3xl text-white">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[9px] font-bold text-ink">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/savant/profile"
            className="hover:opacity-80 transition-opacity flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-3xl text-white">account_circle</span>
          </Link>
        </div>
      </div>

      <div ref={scrollRef} className="no-scrollbar snap-feed relative flex-1 overflow-y-auto">
        {visiblePosts.map((post, index) => {
          const railButtons = [
            <RailButton
              key="tryon"
              primary
              onClick={() => openTryOn(post)}
              icon={
                <svg
                  viewBox="0 0 100 100"
                  className="relative z-10 h-[28px] w-[28px] fill-none stroke-ink transition-colors"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M50 82 C20 58 15 32 35 18 C45 12 50 22 50 22 C50 22 55 12 65 18 C85 32 80 58 50 82 Z" />
                  <path d="M38 32 C34 36 36 43 41 43 C44 43 47 39 45 35 C43 32 39 34 39 38" />
                  <path d="M62 32 C66 36 64 43 59 43 C56 43 53 39 55 35 C57 32 61 34 61 38" />
                </svg>
              }
              label="Try on"
            />,
            <RailButton
              key="cart"
              onClick={() => addPostToCart(post)}
              icon={<span className="material-symbols-outlined text-[26px] text-white/90">add_shopping_cart</span>}
              label="Add to cart"
            />,
            <RailButton
              key="share"
              onClick={() => onShareNative(post)}
              icon={<span className="material-symbols-outlined text-[26px] text-white/90">share</span>}
              label="Share"
            />,
          ];

          return (
            <motion.div
              key={post.id}
              className="h-full w-full"
              initial={{ opacity: 0, scale: 1.03 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, ease: EASE.out }}
            >
              <section className="relative flex h-full w-full items-center justify-center md:gap-5 md:py-[4vh]">
                <div className="relative h-full w-full overflow-hidden bg-dark-grey md:h-full md:w-auto md:aspect-[9/16] md:rounded-2xl">
                  <CurtainReveal delay={0.2} trigger="inView" amount={0.4}>
                    <SwipeToTryOn onOpen={() => openTryOn(post)} label="Try on">
                      <FeedMedia
                        image={post.image}
                        videoUrl={post.videoUrl}
                        alt={post.product.name}
                        seed={post.id}
                      />
                    </SwipeToTryOn>
                  </CurtainReveal>

                  <SwipeTooltip show={index < 3} />

                  <FadeIn
                    delay={1.3}
                    amount={0.4}
                    className="absolute inset-0 feed-gradient pointer-events-none z-20"
                  />

                  <div className="absolute right-3 bottom-28 z-30 flex flex-col items-center gap-4 md:hidden">
                    {railButtons.map((btn, i) => (
                      <FadeIn key={i} delay={2.0 + i * 0.08} y={8} duration={0.5}>
                        {btn}
                      </FadeIn>
                    ))}
                  </div>

                  <div className="pointer-events-none absolute bottom-20 md:bottom-0 left-0 z-30 w-full px-page-x pb-4 md:p-7">
                    <div className="inline-block px-4 py-3 -mx-4 md:mx-0">
                      <FadeIn delay={1.45} y={8} duration={0.7}>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-white/60 mb-1.5">
                          {post.product.vendorName}
                        </p>
                      </FadeIn>
                      <FadeIn delay={1.6} y={14} duration={0.7}>
                        <motion.span
                          className="block font-serif text-3xl md:text-5xl leading-[0.98] text-white font-normal mb-1.5"
                          initial={{ letterSpacing: "0.02em" }}
                          animate={{ letterSpacing: "-0.015em" }}
                          transition={{ delay: 1.6, duration: 0.4 }}
                        >
                          {post.product.name}
                        </motion.span>
                      </FadeIn>
                      <FadeIn delay={1.75} y={6} duration={0.7}>
                        <p className="text-[13px] md:text-[14px] font-normal tabular-nums tracking-[0.08em] text-white/80">
                          {ghs(post.product.priceGHS)}
                        </p>
                      </FadeIn>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-center gap-5 self-end pb-[6vh]">
                  {railButtons.map((btn, i) => (
                    <FadeIn key={i} delay={2.0 + i * 0.08} y={8} duration={0.5}>
                      {btn}
                    </FadeIn>
                  ))}
                </div>
              </section>
            </motion.div>
          );
        })}

        <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
      </div>

      <BottomNav />

    </div>
  );
}

/**
 * Feed action-rail button.
 *
 * `primary` marks the hero action (try-on). It inverts the fill so it differs
 * from the secondary glass buttons in *kind*, not just size, and adds a
 * periodic sheen + nudge to pull the eye to the rail. Both cues are disabled
 * under prefers-reduced-motion, where the inverted fill alone carries the
 * hierarchy.
 */
function RailButton({
  icon,
  label,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="group flex flex-col items-center transition-transform active:scale-95"
    >
      <span className="relative grid place-items-center">
        {/* Halo sits behind the button and outside its overflow clip so it can
            bloom past the edge. */}
        {primary ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-14 w-14 rounded-full bg-white/50 blur-md motion-safe:animate-tryon-halo motion-reduce:hidden"
          />
        ) : null}
        <div
          className={cn(
            "relative grid place-items-center overflow-hidden rounded-full transition-colors",
            primary
              ? "h-14 w-14 bg-white shadow-lg shadow-black/25 ring-1 ring-black/5 group-hover:bg-white motion-safe:animate-tryon-nudge"
              : "h-12 w-12 bg-black/30 backdrop-blur-md group-hover:bg-black/40",
          )}
        >
          {icon}
          {primary ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent motion-safe:animate-tryon-sheen motion-reduce:hidden"
            />
          ) : null}
        </div>
      </span>
      <span
        className={cn(
          "mt-1.5 tracking-wide",
          primary
            ? "text-[12px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
            : "text-[11px] text-white/70",
        )}
      >
        {label}
      </span>
    </button>
  );
}
