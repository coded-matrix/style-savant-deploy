"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/consumer/store";
import { ghs, compactCount } from "@/lib/consumer/format";
import { SmartImage } from "@/components/consumer/SmartImage";
import { Button, TextLink } from "@/components/consumer/Button";
import { SizeSelector } from "@/components/consumer/SizeSelector";
import { BottomSheet } from "@/components/consumer/BottomSheet";
import { TryOnSheet } from "@/components/consumer/TryOnSheet";
import { Skeleton } from "@/components/consumer/Skeleton";
import { FadeIn } from "@/components/consumer/FadeIn";
import { SplitWords } from "@/components/consumer/SplitWords";
import { CurtainReveal } from "@/components/consumer/CurtainReveal";
import { EASE, SPRING } from "@/lib/consumer/motion";
import type { Size } from "@/lib/consumer/types";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { likedProductIds, toggleLikeProduct, addToCart, cartCount, toast, looks, productById, vendorById, artistById } = useApp();
  const product = productById(params.id);

  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState<Size | undefined>();
  const [color, setColor] = useState<string | undefined>(product?.colors?.[0]?.name);
  const [shake, setShake] = useState(false);
  const [cartState, setCartState] = useState<"idle" | "adding" | "added">("idle");
  const [descOpen, setDescOpen] = useState(false);
  const [sizeGuide, setSizeGuide] = useState(false);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [expandedLook, setExpandedLook] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const reduce = useReducedMotion();
  // Product page scrolls inside a nested overflow-y-auto container, not
  // the window — bind useScroll to that ref so parallax actually tracks it.
  const { scrollY } = useScroll({ container: scrollBodyRef });
  const heroY = useTransform(scrollY, [0, 400], [0, -70]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 1.04]);

  if (!product) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-white dark:bg-canvas-dark px-8 text-center">
        <p className="font-display text-headline-md text-ink dark:text-white/90">This item is no longer available</p>
        <Button variant="coral" onClick={() => router.push("/savant/explore")}>
          Explore Similar
        </Button>
      </div>
    );
  }

  const vendor = vendorById(product.vendorId);
  const artist = product.artLinkedArtistId ? artistById(product.artLinkedArtistId) : undefined;
  const liked = likedProductIds.includes(product.id);
  const likeCount = Math.round(product.rating * 23);
  const communityLooks = looks.filter((l) => l.productIds.includes(product.id));
  const allSoldOut = product.soldOut || Object.values(product.stockBySize ?? {}).every((v) => v === false);
  const oosForSize = size ? product.stockBySize?.[size] === false : false;

  const onCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setImgIdx(i);
  };

  const onCarouselTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onCarouselTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    const el = carouselRef.current;
    if (!el) return;
    const isLastImage = imgIdx >= product.images.length - 1;
    if (delta > 80 && isLastImage) {
      setTryOnOpen(true);
    }
  };

  const handleAdd = () => {
    if (allSoldOut || oosForSize) {
      toast("We'll notify you when it's back in stock.", "neutral");
      return;
    }
    if (!size) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      toast("Please select a size.", "warn");
      return;
    }
    setCartState("adding");
    setTimeout(() => {
      addToCart(product.id, size, color);
      setCartState("added");
      setTimeout(() => setCartState("idle"), 1500);
    }, 800);
  };

  const share = async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/savant/product/${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch {
        // cancelled
      }
    } else {
      toast("Share link copied.", "success");
    }
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-surface-dark">
      {/* top bar — staggered entrance */}
      <div className="z-30 flex h-14 shrink-0 items-center justify-between px-page-x">
        <FadeIn delay={0.1} y={0} duration={0.3}>
          <button onClick={() => router.back()} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-low dark:hover:bg-white/10">
            <span className="material-symbols-outlined text-[24px] text-ink dark:text-off-white">chevron_left</span>
          </button>
        </FadeIn>
        <div className="flex items-center gap-1">
          <FadeIn delay={0.14} y={0} duration={0.3}>
            <button onClick={() => router.push("/savant/cart")} aria-label="Cart" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-low dark:hover:bg-white/10 relative">
              <span className="material-symbols-outlined text-[22px] text-ink dark:text-off-white">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-ink text-[9px] font-bold text-off-white dark:bg-off-white dark:text-ink">
                  {cartCount}
                </span>
              )}
            </button>
          </FadeIn>
          <FadeIn delay={0.18} y={0} duration={0.3}>
            <button onClick={share} aria-label="Share" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-low dark:hover:bg-white/10">
              <span className="material-symbols-outlined text-[20px] text-ink dark:text-off-white">share</span>
            </button>
          </FadeIn>
          <FadeIn delay={0.22} y={0} duration={0.3}>
            <button onClick={() => toggleLikeProduct(product.id)} aria-label="Like" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-low dark:hover:bg-white/10 relative">
              <span
                className={cn("material-symbols-outlined text-[20px] text-ink dark:text-off-white transition-all", liked && "scale-110 text-coral animate-pop")}
                style={liked ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >favorite</span>
            </button>
          </FadeIn>
        </div>
      </div>

      {/* scroll body */}
      <div ref={scrollBodyRef} className="no-scrollbar flex-1 overflow-y-auto pb-4">
       {/* two-column desktop layout at lg+ (gallery | info); single column on mobile */}
       <div className="lg:mx-auto lg:grid lg:max-w-[1200px] lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-8 lg:pt-2 lg:items-start">
        {/* LEFT — gallery */}
        <div>
        {/* carousel — curtain reveal + parallax on md+ */}
        <motion.div
          ref={carouselRef}
          onScroll={onCarouselScroll}
          onTouchStart={onCarouselTouchStart}
          onTouchEnd={onCarouselTouchEnd}
          style={reduce ? undefined : { y: heroY, scale: heroScale }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: EASE.out }}
          className="no-scrollbar flex aspect-square w-full snap-row overflow-x-auto md:aspect-[4/5]"
        >
          {product.images.map((src, i) => {
            const isLast = i === product.images.length - 1;
            return (
              <div key={i} className="relative h-full w-full shrink-0 snap-center">
                <CurtainReveal delay={0.2}>
                  <SmartImage src={src} alt={`${product.name} ${i + 1}`} seed={`${product.id}-${i}`} label={product.name} fill />
                </CurtainReveal>
                {isLast && product.images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                    <span className="flex items-center gap-1.5 rounded-pill bg-black/60 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm">
                      <span className="material-symbols-outlined text-[14px]">swipe_left</span>
                      Swipe to try on
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
        <div className="mt-6 flex justify-center gap-1.5">
          {product.images.map((_, i) => (
            <span key={i} className={cn("h-1.5 rounded-pill transition-all", i === imgIdx ? "w-5 bg-ink dark:bg-off-white" : "w-1.5 bg-line dark:bg-white/10")} />
          ))}
        </div>
        </div>
        {/* RIGHT — info */}
        <div className="px-page-x lg:px-0 lg:pt-2">
          <h1 className="mt-4 font-serif text-4xl md:text-6xl lg:text-5xl xl:text-6xl leading-[0.95] tracking-[-0.02em] text-ink dark:text-off-white font-normal">
            <SplitWords text={product.name} delay={1.3} />
          </h1>
          <FadeIn delay={1.45} y={8} duration={0.7}>
            <Link
              href={`/savant/vendor/${product.vendorId}`}
              className="mt-1 inline-block text-[11px] uppercase tracking-[0.24em] text-mid-grey link-wipe font-medium dark:text-white/60"
            >
              {product.vendorName}
            </Link>
          </FadeIn>
          <div className="mt-2 flex items-center gap-3">
            <FadeIn delay={1.6} y={8} duration={0.7}>
              <span className="text-[16px] md:text-[18px] font-normal tabular-nums tracking-[0.08em] text-ink dark:text-off-white">{ghs(product.priceGHS)}</span>
            </FadeIn>
            <FadeIn delay={1.75} y={8} duration={0.7}>
              <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-mid-grey font-medium dark:text-white/60">
                <span className="material-symbols-outlined text-[12px] text-mid-grey dark:text-white/60" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> {product.rating}
              </span>
            </FadeIn>
            {liked && (
              <FadeIn delay={1.75} y={8} duration={0.7}>
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-mid-grey font-medium">
                  <span className="material-symbols-outlined text-[12px] text-coral" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span> {compactCount(likeCount)}
                </span>
              </FadeIn>
            )}
          </div>

          {/* size */}
          <FadeIn delay={1.9} y={8} duration={0.7}>
          <div className="mt-5">
            {allSoldOut && (
              <div className="mb-2 rounded-card bg-mid-grey/10 dark:bg-white/10 px-3 py-2 font-display text-[13px] font-bold text-mid-grey dark:text-white/70">
                Currently sold out
              </div>
            )}
            <motion.div
              animate={shake ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.45, ease: "linear" }}
              onAnimationComplete={() => setShake(false)}
            >
            <SizeSelector
              product={product}
              value={size}
              onChange={setSize}
              selectedTone="coral"
              onErrorShake={shake}
            />
            </motion.div>
            <button onClick={() => setSizeGuide(true)} className="mt-2 text-[11px] uppercase tracking-[0.24em] link-wipe text-ink dark:text-off-white font-medium">
              Find my size
            </button>
          </div>
          </FadeIn>

          {/* colour */}
          {product.colors && product.colors.length > 1 && (
            <FadeIn delay={2.1} y={8} duration={0.7}>
            <div className="mt-5">
              <p className="mb-1.5 text-[11px] uppercase tracking-[0.24em] text-mid-grey font-medium dark:text-white/60">Colour</p>
              <div className="flex gap-2.5">
                {product.colors.map((c) => (
                  <motion.button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    aria-label={c.name}
                    className={cn(
                      "h-6 w-6 rounded-full ring-2 ring-offset-2 transition-transform",
                      color === c.name ? "ring-ink dark:ring-off-white scale-110" : "ring-transparent"
                    )}
                    style={{ backgroundColor: c.hex }}
                    whileTap={{ scale: 1.08 }}
                  />
                ))}
              </div>
            </div>
            </FadeIn>
          )}

          {/* inline CTAs — desktop only (mobile uses the sticky footer) */}
          <div className="mt-6 hidden gap-3 lg:flex">
            <Button variant="teal" size="md" className="flex-1" onClick={() => setTryOnOpen(true)}>
              Try This On
            </Button>
            <Button
              variant="coral"
              size="md"
              className="flex-1"
              loading={cartState === "adding"}
              onClick={handleAdd}
            >
              {allSoldOut || oosForSize ? "Notify Me" : cartState === "added" ? "Added!" : "Add to Cart"}
            </Button>
          </div>

          {/* accordions */}
          <FadeIn delay={2.2} y={8} duration={0.7}>
          <div className="mt-6 divide-y divide-line dark:divide-white/10 border-y border-line dark:border-white/10">
            <Accordion title="Description" defaultOpen>
              <p className="text-body-md text-ink-variant dark:text-white/70">{product.description}</p>
              {product.styleTags && product.styleTags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.styleTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-line dark:border-white/15 px-3 py-1 text-caption text-ink-variant dark:text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </Accordion>
            <Accordion title="Vendor">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-line dark:ring-white/10">
                  <SmartImage src={vendor?.logo ?? ""} alt={product.vendorName} seed={product.vendorId} className="h-full w-full" />
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-ink dark:text-off-white">{product.vendorName}</p>
                  <p className="text-[12px] text-mid-grey dark:text-white/60">{vendor?.bio}</p>
                </div>
              </div>
            </Accordion>
            <Accordion title="Delivery">
              <p className="flex items-center gap-2 text-body-md text-ink-variant dark:text-white/70">
                <span className="material-symbols-outlined text-[16px] text-teal dark:text-white/70">local_shipping</span> {product.deliveryInfo}
              </p>
            </Accordion>
            <Accordion title="Returns">
              <p className="flex items-center gap-2 text-body-md text-ink-variant dark:text-white/70">
                <span className="material-symbols-outlined text-[16px] text-teal dark:text-white/70">refresh</span> {product.returnPolicy}
              </p>
            </Accordion>
          </div>
          </FadeIn>

          {/* artist backdrop link */}
          {artist && (
            <Link
              href={`/savant/artist/${artist.id}`}
              className="mt-4 flex items-center gap-3 border-y border-line py-6 my-8"
            >
              <span className="h-12 w-12 overflow-hidden rounded-card">
                <SmartImage src={artist.portrait} alt={artist.name} seed={artist.id} className="h-full w-full" />
              </span>
              <span className="flex-1">
                <span className="block font-serif text-lg font-normal text-ink dark:text-off-white">See the art that inspired this look</span>
                <span className="block text-[12px] text-mid-grey dark:text-white/60">by {artist.name}</span>
              </span>
            </Link>
          )}

          {/* community looks */}
          {communityLooks.length > 0 && (
            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-[0.24em] font-medium text-mid-grey dark:text-white/60 mb-4">Community looks featuring this item</p>
              <div className="no-scrollbar -mx-page-x mt-3 flex gap-3 overflow-x-auto px-page-x">
                {communityLooks.map((l, index) => (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-[80px] shrink-0"
                  >
                  <button
                    onClick={() => setExpandedLook(l.id)}
                    className="w-full"
                  >
                    <span className="block aspect-[4/5] overflow-hidden rounded-card ring-1 ring-line dark:ring-white/10">
                      <SmartImage src={l.image} alt={l.caption} seed={l.id} className="h-full w-full" />
                    </span>
                    <span className="mt-1 block truncate text-[11px] font-bold text-ink dark:text-off-white">@{l.username}</span>
                  </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
       </div>
      </div>

      {/* sticky CTAs — mobile/tablet only; desktop shows inline CTA in right column */}
      <motion.div
        className="z-30 flex shrink-0 gap-3 border-t border-line dark:border-white/10 bg-white px-page-x pt-3 pb-8 dark:bg-surface-dark lg:hidden"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.9, ...SPRING.ui }}
      >
        <Button variant="teal" size="md" className="flex-1" onClick={() => setTryOnOpen(true)}>
          Try This On
        </Button>
        <Button
          variant="coral"
          size="md"
          className="flex-1"
          loading={cartState === "adding"}
          onClick={handleAdd}
        >
          {allSoldOut || oosForSize ? "Notify Me" : cartState === "added" ? "Added!" : "Add to Cart"}
        </Button>
      </motion.div>

      {/* size guide sheet */}
      <BottomSheet open={sizeGuide} onClose={() => setSizeGuide(false)} title="Size Guide" height={60}>
        <div className="space-y-2 text-body-md text-ink-variant dark:text-white/70">
          <p>Measure your chest, waist, and hips with a soft tape. Compare to our chart:</p>
          <table className="mt-2 w-full text-[13px]">
            <thead>
              <tr className="text-left text-mid-grey dark:text-white/60">
                <th className="py-4">Size</th>
                <th className="py-4">Chest (cm)</th>
                <th className="py-4">Waist (cm)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["XS", "84", "66"],
                ["S", "90", "72"],
                ["M", "96", "78"],
                ["L", "102", "84"],
                ["XL", "108", "90"],
                ["XXL", "114", "96"],
              ].map((r) => (
                <tr key={r[0]} className="border-t border-line dark:border-white/10">
                  <td className="py-3.5 font-bold text-ink dark:text-off-white">{r[0]}</td>
                  <td className="py-3.5">{r[1]}</td>
                  <td className="py-3.5">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BottomSheet>

      {/* community look expand */}
      <BottomSheet
        open={!!expandedLook}
        onClose={() => setExpandedLook(null)}
        title="Look"
        height={70}
      >
        {expandedLook &&
          (() => {
            const l = communityLooks.find((x) => x.id === expandedLook)!;
            return (
              <div>
                <div className="relative aspect-video w-full overflow-hidden rounded-card">
                  <SmartImage src={l.image} alt={l.caption} seed={l.id} label="look" fill />
                </div>
                <p className="mt-3 font-display text-sm font-bold text-ink dark:text-off-white">@{l.username}</p>
                <p className="mt-1 text-body-md text-ink-variant dark:text-white/70">{l.caption}</p>
              </div>
            );
          })()}
      </BottomSheet>

      <TryOnSheet open={tryOnOpen} product={product} onClose={() => setTryOnOpen(false)} onChangeProduct={() => setTryOnOpen(false)} />
    </div>
  );
}

function Accordion({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="py-6">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <span className="font-serif text-xl md:text-2xl font-normal text-ink dark:text-white/90">{title}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="material-symbols-outlined text-[20px] text-mid-grey dark:text-white/60"
        >expand_more</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: EASE.inOut }}
            className="mt-2.5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
