"use client";

import { useMemo, useState } from "react";
import type { ComponentProps } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/consumer/store";
import { SmartImage } from "@/components/consumer/SmartImage";
import { VendorProductTile } from "@/components/consumer/VendorProductTile";
import { Button } from "@/components/consumer/Button";
import { EmptyState } from "@/components/consumer/EmptyState";
import { Skeleton } from "@/components/consumer/Skeleton";
import { TopBar } from "@/components/consumer/TopBar";
import { BottomNav } from "@/components/consumer/BottomNav";
import { CurtainReveal } from "@/components/consumer/CurtainReveal";
import { FadeIn } from "@/components/consumer/FadeIn";
import { EASE } from "@/lib/consumer/motion";
import type { Category } from "@/lib/consumer/types";

const CATEGORIES: { label: string; value: Category }[] = [
  { label: "All Pieces", value: "All" },
  { label: "Tops", value: "Tops" },
  { label: "Bottoms", value: "Bottoms" },
  { label: "Dresses", value: "Dresses" },
  { label: "Shoes", value: "Shoes" },
];

export default function VendorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast, vendorById, productsByVendor } = useApp();
  const vendor = vendorById(params.id);
  const [selectedCat, setSelectedCat] = useState<Category>("All");
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const reduce = useReducedMotion();

  const products = useMemo(() => {
    const all = vendor ? productsByVendor(vendor.id) : [];
    return selectedCat === "All" ? all : all.filter((p) => p.category === selectedCat);
  }, [vendor, selectedCat]);

  const stats = useMemo(() => {
    const all = vendor ? productsByVendor(vendor.id) : [];
    return {
      rating: "4.9",
      followers: `${Math.max(1, Math.floor(all.length * 37))}`,
      items: String(all.length),
    };
  }, [vendor, productsByVendor]);

  const onFilter = (c: Category) => {
    setSelectedCat(c);
    setLoading(true);
    setTimeout(() => setLoading(false), 450);
  };

  if (!vendor) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-surface-bright dark:bg-canvas-dark px-8 text-center">
        <p className="font-serif text-headline-md text-ink dark:text-off-white">This vendor is not available.</p>
        <Button variant="greyOutline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const share = async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/savant/vendor/${vendor.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: vendor.name, url });
      } catch {
        // cancelled
      }
    } else {
      toast("Share link copied.", "success");
    }
  };

  const gridContainer: ComponentProps<typeof motion.div> = reduce
    ? {}
    : {
        initial: "hidden",
        whileInView: "show",
        viewport: { once: true, margin: "-80px" },
        variants: {
          hidden: {},
          show: { transition: { staggerChildren: 0.06 } },
        },
      };
  const gridItem: ComponentProps<typeof motion.div> = reduce
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 24 },
          show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1] } },
        },
      };

  return (
    <div className="flex h-full flex-col bg-surface-bright dark:bg-canvas-dark">
      {/* Quiet chrome */}
      <TopBar
        title={vendor.name}
        titleClassName="font-display text-[16px] font-bold text-ink dark:text-white"
        right={
          <button
            onClick={share}
            aria-label="Share"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-low dark:hover:bg-white/10 text-ink dark:text-off-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
        }
      />

      <div         className="no-scrollbar flex-1 overflow-y-auto pb-6 md:pb-12">
        {/* ── Full-bleed editorial hero ───────────────────────────── */}
        <section className="relative h-[56vh] min-h-[380px] w-full overflow-hidden md:h-[72vh]">
          <CurtainReveal delay={0.2} duration={1.1} color="bg-ink">
            <motion.div
              initial={reduce ? false : { scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.4, ease: EASE.out }}
              className="absolute inset-0"
            >
              <SmartImage src={vendor.cover} alt={vendor.name} seed={`${vendor.id}-cover`} label={vendor.name} fill className="object-cover" />
            </motion.div>
          </CurtainReveal>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 px-page-x pb-8 md:pb-16 lg:pb-20">
            <FadeIn delay={0.9} y={8} duration={0.7}>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/70 font-medium">
                Member since {new Date(vendor.memberSince).getFullYear()}
              </p>
            </FadeIn>
            <FadeIn delay={1.05} y={12} duration={0.7}>
              <h1 className="mt-2 font-ubuntu text-[clamp(2.75rem,9vw,5.5rem)] font-normal leading-[0.95] tracking-[-0.02em] text-white">
                {vendor.name}
                {vendor.verified && (
                  <span className="material-symbols-outlined align-middle ml-3 text-[0.45em] text-white/90" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                )}
              </h1>
            </FadeIn>
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-16">
          {/* ── Manifesto + stats ────────────────────────────────── */}
          <section className="border-b border-line dark:border-white/10 py-12 md:py-20 lg:py-24">
            <p className="text-[11px] uppercase tracking-[0.28em] text-mid-grey dark:text-white/50 font-medium">
              The Atelier
            </p>
            <p className="mt-4 max-w-[60ch] font-ubuntu text-2xl md:text-3xl font-normal leading-[1.35] text-ink dark:text-off-white">
              {vendor.bio}
            </p>

            <div className="mt-10 flex flex-wrap gap-x-14 gap-y-8">
              {[
                { n: stats.items, l: "Pieces" },
                { n: stats.followers, l: "Followers" },
                { n: stats.rating, l: "Rating" },
              ].map((s) => (
                <div key={s.l}>
                  <span className="block font-ubuntu text-5xl md:text-7xl font-normal leading-none text-ink dark:text-off-white">
                    {s.n}
                  </span>
                  <span className="mt-2 block text-[11px] uppercase tracking-[0.2em] text-mid-grey dark:text-white/50 font-medium">
                    {s.l}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                variant={isFollowing ? "greyOutline" : "coral"}
                size="md"
                onClick={() => {
                  setIsFollowing((f) => !f);
                  toast(isFollowing ? "Unfollowed store" : "Following store", "success");
                }}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button variant="greyOutline" size="md" onClick={() => toast("Messaging starting...", "neutral")}>
                Message
              </Button>
            </div>
          </section>

          {/* ── Collections filter ──────────────────────────────── */}
          <section className="py-8 md:py-12">
            <p className="text-[11px] uppercase tracking-[0.28em] text-mid-grey dark:text-white/50 font-medium">
              Collections
            </p>
            <div className="no-scrollbar -mx-page-x mt-4 flex gap-2 overflow-x-auto px-page-x md:mx-0 md:px-0">
              {CATEGORIES.map((c) => {
                const active = selectedCat === c.value;
                return (
                  <button
                    key={c.label}
                    onClick={() => onFilter(c.value)}
                    className={`shrink-0 rounded-pill px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.08em] transition-all duration-300 border ${
                      active
                        ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink"
                        : "border-line dark:border-white/15 text-ink dark:text-white/70 hover:border-ink dark:hover:border-white/50"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Editorial product grid ──────────────────────────── */}
          <section className="pb-10 pt-4 md:pt-10 md:pb-16">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-ubuntu text-3xl md:text-4xl font-normal leading-none text-ink dark:text-off-white">
                The Collection
              </h2>
              <span className="text-[11px] uppercase tracking-[0.2em] text-mid-grey dark:text-white/50 font-medium">
                {products.length} Pieces
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-xl bg-white ring-1 ring-line dark:bg-surface-dark dark:ring-white/10">
                    <Skeleton className="aspect-[3/4] w-full" />
                    <div className="space-y-2 p-4">
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                illustration="grid"
                headline="No pieces yet. Check back soon."
              />
            ) : (
              <motion.div
                {...gridContainer}
                className="grid grid-cols-2 gap-4 lg:gap-6 md:grid-cols-3 lg:grid-cols-4"
              >
                {products.map((p, i) => (
                  <motion.div key={p.id} {...gridItem} className={i === 0 ? "col-span-2" : ""}>
                    <VendorProductTile
                      product={p}
                      aspect={i === 0 ? "aspect-[16/10]" : "aspect-[3/4]"}
                      featured={i === 0}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
