"use client";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected photo."));
    reader.readAsDataURL(file);
  });
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/consumer/store";
import { ghs } from "@/lib/consumer/format";
import { BottomNav } from "@/components/consumer/BottomNav";
import { Button } from "@/components/consumer/Button";
import { Skeleton } from "@/components/consumer/Skeleton";
import { authApi } from "@/lib/api/auth";
import type { Product } from "@/lib/consumer/types";
import {
  clearStudioDraft,
  hasStudioItems,
  loadStudioDraft,
  saveStudioDraft,
  type SelectedItem,
  type SlotKey,
} from "@/lib/consumer/studio-draft";

const EMPTY_SLOTS: Record<SlotKey, SelectedItem | null> = {
  Top: null,
  Bottom: null,
  Shoes: null,
  Accessory: null,
  Outerwear: null,
};

/**
 * Keyword heuristics used to classify a product into an outfit slot. A product
 * is matched to a slot if its name/description contains one of these words.
 */
const SLOT_KEYWORDS: Record<SlotKey, string[]> = {
  Top: ["shirt", "top", "blouse", "tee", "t-shirt", "sweater", "knit", "polo", "camisole"],
  Bottom: ["pants", "skirt", "shorts", "trousers", "jeans", "dress", "drape", "leggings"],
  Shoes: ["shoe", "sneaker", "boot", "sandal", "slide", "heel", "loafer", "mule"],
  Accessory: ["bag", "necklace", "scarf", "hat", "jewel", "ring", "earring", "belt", "collar", "clutch"],
  Outerwear: ["jacket", "coat", "cardigan", "blazer", "wrap", "overcoat", "parka", "trench"],
};

/**
 * Product categories that populate each outfit slot's recommendations. Now that
 * vendors assign real categories, these drive the "Complete the look" browser —
 * each slot acts as a category filter for the options shown below.
 */
const SLOT_CATEGORIES: Record<SlotKey, string[]> = {
  Top: ["Tops", "Dresses"],
  Bottom: ["Bottoms", "Dresses"],
  Shoes: ["Shoes"],
  Accessory: ["Accessories"],
  Outerwear: ["Tops"],
};

/** Filter the full inventory down to products that fit a given slot + query. */
function productsForSlot(
  products: Product[],
  slot: SlotKey,
  query: string,
): Product[] {
  const cats = SLOT_CATEGORIES[slot];
  const kw = SLOT_KEYWORDS[slot];
  const hay = (p: Product) => `${p.name} ${p.description}`.toLowerCase();
  const pool = products.filter((p) => !p.soldOut);

  // Category is the primary signal; keyword matches augment it so items whose
  // category is coarse ("Other") but clearly a top/shoe/etc. still surface.
  const byCategory = pool.filter((p) => cats.includes(p.category as string));
  const byKeyword = pool.filter((p) => kw.some((k) => hay(p).includes(k)));
  let matched = [...new Set([...byCategory, ...byKeyword])];
  // Nothing matched (sparse catalog) — show the whole pool rather than empty.
  if (matched.length === 0) matched = pool;

  const q = query.trim().toLowerCase();
  if (q) matched = matched.filter((p) => p.name.toLowerCase().includes(q));

  return [...matched].sort((a, b) => b.rating - a.rating);
}

function toSelectedItem(p: Product): SelectedItem {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.priceGHS),
    image: p.images?.[0] || "",
    clothImage: p.clothImages?.[0],
  };
}

export default function StudioPage() {
  const router = useRouter();
  const { addToCart, toast, productById, products, user, setUser,
    tryOn, runTryOn, hydrateTryOn, clearTryOn, ackTryOn } = useApp();

  const [productId, setProductId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<SlotKey>("Top");
  // Try-on state now lives in the store so it survives navigating to the feed
  // mid-render. Derive the local view flags from it.
  const tryingOn = tryOn.status === "rendering";
  const tryOnImage = tryOn.image;
  const tryOnActive = tryOn.status === "done" && !!tryOn.image;
  const [panelView, setPanelView] = useState<"normal" | "expanded">("normal");
  const expanded = panelView === "expanded";
  // The active garment is the single item currently being tried on — it lives in
  // the first box. Selecting any recommendation replaces it. Category boxes act
  // as filters that change which options appear in "Complete the look".
  const [activeGarment, setActiveGarment] = useState<SelectedItem | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const [search, setSearch] = useState("");
  const [restored, setRestored] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [slots, setSlots] = useState<Record<SlotKey, SelectedItem | null>>(EMPTY_SLOTS);

  // Mount: parse the incoming productId (feed → studio) and restore any
  // in-progress draft saved within the last 24 hours.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = new URLSearchParams(window.location.search).get("productId");
      const id = raw?.trim() || null;
      const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      setProductId(id && uuidLike.test(id) ? id : null);

      const draft = loadStudioDraft();
      if (draft) {
        setSlots(draft.slots);
        setActiveSlot(draft.activeSlot);
        // Restore the active garment from the slot the draft was focused on,
        // falling back to the first filled slot.
        const restoredGarment =
          draft.slots[draft.activeSlot] ??
          Object.values(draft.slots).find((s) => s !== null) ??
          null;
        if (restoredGarment) setActiveGarment(restoredGarment);
        // Restore a saved result into the store only if it's idle (a full page
        // reload loses in-memory state, but never clobber an in-flight render).
        if (draft.tryOnImage) hydrateTryOn(draft.tryOnImage);
      }
    }
    // Entering the Studio counts as "seeing" any finished render, so the
    // resume-button attention animation stops.
    ackTryOn();
    setRestored(true);
  }, [hydrateTryOn, ackTryOn]);

  // Reset the per-slot search box whenever the active slot changes.
  useEffect(() => {
    setSearch("");
  }, [activeSlot]);

  const leadProduct = useMemo(() => {
    if (!productId) return null;
    return productById(productId);
  }, [productId, productById]);

  // A product arriving from the feed (swipe-to-try-on) becomes the active
  // garment in the first box, and also fills the Top slot, without disturbing
  // any other slots already restored from the draft.
  useEffect(() => {
    if (leadProduct) {
      const item = toSelectedItem(leadProduct);
      setSlots((prev) => ({ ...prev, Top: item }));
      setActiveGarment(item);
    }
  }, [leadProduct]);

  // Persist the draft (debounced) whenever the outfit changes, but only once
  // the initial restore has completed so we never clobber a saved draft.
  useEffect(() => {
    if (!restored) return;
    const t = setTimeout(() => {
      if (hasStudioItems({ slots, activeSlot, photo: null, tryOnImage, savedAt: 0 })) {
        saveStudioDraft({
          slots,
          activeSlot,
          photo: user.fitProfile?.photo ?? null,
          tryOnImage,
        });
      } else {
        // Outfit emptied (all slots cleared) — drop any stale draft so the
        // "Continue your outfit" prompt doesn't point at an empty studio.
        clearStudioDraft();
      }
    }, 300);
    return () => clearTimeout(t);
  }, [slots, activeSlot, tryOnImage, user.fitProfile?.photo, restored]);

  const selectRecommendation = (item: SelectedItem) => {
    setSlots((prev) => ({
      ...prev,
      [activeSlot]: item,
    }));
    // The picked item becomes the active garment shown in the first box,
    // replacing whatever was there before.
    setActiveGarment(item);
    toast(`${item.name} selected.`, "success");
  };

  const startFresh = () => {
    setSlots(EMPTY_SLOTS);
    setActiveGarment(null);
    clearTryOn();
    clearStudioDraft();
    toast("Started a fresh outfit.", "neutral");
  };

  const handleAddAllToCart = () => {
    const activeItems = Object.values(slots).filter((item): item is SelectedItem => item !== null);
    if (activeItems.length === 0) {
      toast("Outfit is empty.", "warn");
      return;
    }
    activeItems.forEach((item) => {
      addToCart(item.id, "M");
    });
    // The outfit is being purchased — the draft is complete.
    clearStudioDraft();
    toast(`Added ${activeItems.length} items to cart!`, "success");
    router.push("/savant/cart");
  };

  const handleSaveOutfit = () => {
    if (tryOnActive && tryOnImage) {
      // Look is complete and saved — clear the in-progress draft AND the
      // try-on result. Without resetting the store the studio would still
      // read `done` on the way back, leaving the action stuck on
      // "Finish Try-On" with no way to start a new look.
      clearStudioDraft();
      clearTryOn();
      toast("Try-on look saved to your Profile gallery!", "success");
      router.push("/savant/gallery");
    } else {
      toast("Please run 'Try On' first to generate and save your look.", "warn");
    }
  };

  // Discard the current result and return to the plain photo so the user can
  // try a different garment (or a different photo) without leaving the studio.
  const handleStartOver = () => {
    clearTryOn();
    toast("Ready for another try-on.", "neutral");
  };

  const handleTryOn = async () => {
    // The garment in the first box is the try-on target; fall back to any slot
    // item or the incoming feed product.
    const activeItem = activeGarment ?? slots[activeSlot];
    const fallbackItem = Object.values(slots).find((s) => s !== null) ?? null;
    const activeProductId = activeItem?.id || productId || fallbackItem?.id;
    // Prefer the cloth-only garment image for the AI try-on; fall back to the
    // display image only when no cloth image is available.
    const activeGarmentUrl =
      activeItem?.clothImage ||
      activeItem?.image ||
      leadProduct?.clothImages?.[0] ||
      leadProduct?.images?.[0] ||
      fallbackItem?.clothImage ||
      fallbackItem?.image;

    if (!activeProductId) {
      toast("Please pick a product to try on.", "warn");
      return;
    }
    if (user.isGuest) {
      toast("Please log in to use the try-on feature.", "neutral");
      router.push("/savant/auth");
      return;
    }
    if (!user.fitProfile?.photo) {
      toast("Please upload a photo of yourself to use the try-on feature.", "neutral");
      router.push(`/savant/profile/upload?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // runTryOn lives in the store, so the render (and its result) survive the
    // user leaving for the feed while it's in progress. Toasts fire from there.
    try {
      await runTryOn(activeProductId, activeGarmentUrl);
    } catch {
      // Already surfaced via toast inside the store.
    }
  };

  const activeRecs = useMemo(
    () => productsForSlot(products, activeSlot, search),
    [products, activeSlot, search],
  );
  const loadingRecs = !restored;
  const outfitHasItems = useMemo(
    () => Object.values(slots).some((s) => s !== null),
    [slots],
  );

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast("Photo too large. Please use an image under 10MB.", "error");
      return;
    }

    setUploadingPhoto(true);
    try {
      // Keep a persistent local copy first; blob URLs can disappear after navigation.
      let url = await fileToDataUrl(file);

      // Prefer the backend when available, but do not block try-on if it is offline.
      if (!user.isGuest) {
        try {
          const res = await authApi.uploadProfilePhoto(file);
          if (typeof res.fitPhoto === "string" && res.fitPhoto.length > 0) {
            url = `data:image/jpeg;base64,${res.fitPhoto}`;
          }
        } catch {
          toast("Photo saved locally. You can continue to try on.", "neutral");
        }
      }

      setUser({
        avatar: url,
        fitProfile: {
          ...user.fitProfile,
          photo: url,
          modelId: undefined, // Clear preset model since they uploaded their own photo
        },
      });
      setPhotoError(false);
      // A new photo invalidates any prior render; show the fresh photo.
      clearTryOn();
      toast("Photo updated! Run Try On again for a fresh look.", "success");
    } catch (err: any) {
      toast("Failed to save photo: " + (err.message || err), "error");
    } finally {
      setUploadingPhoto(false);
      // Reset the input so re-selecting the same file still fires onChange.
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  return (
    <div className="relative flex h-full flex-col bg-white dark:bg-surface-dark overflow-hidden md:pb-0 pb-[76px] font-body text-body-md">
      {/* TopAppBar */}
      <header className="bg-white dark:bg-canvas-dark flex justify-between items-center px-6 py-4 w-full z-50 shrink-0 border-b border-line/20 dark:border-white/10">
        <button
          onClick={() => {
            clearStudioDraft();
            setSlots(EMPTY_SLOTS);
            setActiveGarment(null);
            clearTryOn();
            if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
              router.back();
            } else {
              router.replace("/savant/feed");
            }
          }}
          aria-label="Cancel and discard outfit"
          className="text-mid-grey dark:text-white/60 hover:text-ink dark:hover:text-white/80 active:scale-95 transition-all text-label-bold"
        >
          Cancel
        </button>
        <h1 className="font-display text-[22px] leading-[28px] font-bold text-ink dark:text-white">Style Savant</h1>
        <button
          onClick={handleSaveOutfit}
          aria-label="Save outfit"
          className="text-ink dark:text-off-white hover:opacity-80 active:scale-95 transition-transform text-label-bold"
        >
          Save
        </button>
      </header>

      {/* Always-mounted photo input (triggered from the placeholder or the "You" box) */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col md:flex-row relative w-full overflow-hidden">
        {/* Upper Try-on Canvas */}
        <section className={cn(
          "relative bg-surface-low dark:bg-surface-dark w-full flex items-center justify-center overflow-hidden shrink-0 transition-all duration-300",
          expanded ? "h-0 md:h-full md:w-0" : "h-[45%] md:h-full md:w-[55%]"
        )}>
          {/* Try-on canvas */}
          {tryOnActive && tryOnImage ? (
            <>
              <img
                key={tryOnImage}
                src={tryOnImage}
                alt="AI try-on result"
                className="absolute inset-0 w-full h-full object-contain animate-fade-in"
                crossOrigin="anonymous"
              />
              {/* Escape hatches from a finished result — without these the
                  canvas is a dead end and the action button stays on
                  "Finish Try-On" forever. */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                <button
                  onClick={handleStartOver}
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-white/30 bg-black/40 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md transition-all hover:bg-black/55 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  Start over
                </button>
                <button
                  onClick={() => {
                    clearTryOn();
                    photoInputRef.current?.click();
                  }}
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-white/30 bg-black/40 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md transition-all hover:bg-black/55 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                  Change photo
                </button>
              </div>
            </>
          ) : user.fitProfile?.photo && !photoError ? (
            <>
              <img
                src={user.fitProfile.photo}
                alt="Your photo"
                className={cn(
                  "absolute inset-0 w-full h-full object-contain transition-all duration-700",
                  tryingOn ? "blur-xl scale-105" : "blur-0"
                )}
                onError={() => setPhotoError(true)}
              />
              {!tryingOn && (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  type="button"
                  className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-full border border-white/30 bg-black/40 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-white hover:bg-black/55 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                  Change photo
                </button>
              )}
            </>
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center gap-3">
              <button
                onClick={() => photoInputRef.current?.click()}
                type="button"
                className="flex flex-col items-center justify-center gap-3 text-mid-grey dark:text-white/50 hover:text-ink dark:hover:text-white/80 transition-colors"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-black/5 dark:bg-white/8">
                  <span className="material-symbols-outlined text-[28px]">photo_camera</span>
                </span>
                <span className="text-[13px] font-bold">Take or upload a photo</span>
                <span className="text-[11px] text-mid-grey/70 dark:text-white/30">For AI try-on</span>
              </button>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface/50 dark:to-surface-dark/50" />

          {tryingOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white z-20 bg-black/25 backdrop-blur-[2px]">
              {/* Shimmer sweep suggesting the look is being revealed */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-reveal-sweep" />
              </div>
              <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
              <p className="font-display text-sm font-bold animate-pulse">Revealing your look…</p>
              <button
                onClick={() => router.push("/savant/feed")}
                className="mt-1 flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 backdrop-blur-md px-4 py-2 text-caption font-bold text-white active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[16px]">dynamic_feed</span>
                Browse feed while it renders
              </button>
            </div>
          )}

        </section>

        {/* Lower Outfit Slots & Recommendations */}
        <section className={cn(
          "bg-surface dark:bg-canvas-dark flex flex-col pt-3 pb-4 md:rounded-none rounded-t-xl z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] overflow-hidden md:overflow-y-auto justify-between transition-all duration-300",
          expanded ? "flex-grow h-auto md:w-full" : "h-[55%] md:h-full md:w-[45%] shrink-0"
        )}>
          {/* Single handle: taps toggle the browser between normal and full screen */}
          <button
            type="button"
            aria-label={expanded ? "Shrink browser" : "Expand browser to full screen"}
            onClick={() => setPanelView(expanded ? "normal" : "expanded")}
            className="flex flex-col items-center justify-center py-2 shrink-0 w-full cursor-pointer hover:bg-surface-dim/40 dark:hover:bg-white/5 transition-colors"
          >
            <div className="w-12 h-1 rounded-full bg-line/80 dark:bg-white/20 mb-1" />
            <span className="material-symbols-outlined text-[16px] text-mid-grey dark:text-white/60 leading-none">
              {expanded ? "keyboard_arrow_down" : "keyboard_arrow_up"}
            </span>
          </button>

          {(
            <>
              {/* Selected garment + category filter pills */}
              <div className="px-6 pb-3 shrink-0 flex items-center gap-3">
                {/* The single active garment being tried on */}
                <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden border-2 border-ink dark:border-white/40 bg-white dark:bg-surface-dark flex items-center justify-center">
                  {activeGarment ? (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${activeGarment.image}')` }}
                      />
                      <button
                        onClick={() => setActiveGarment(null)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
                        aria-label="Clear selected garment"
                      >
                        <span className="material-symbols-outlined text-[11px]">close</span>
                      </button>
                    </>
                  ) : (
                    <span className="material-symbols-outlined text-mid-grey dark:text-white/50 text-lg">checkroom</span>
                  )}
                </div>

                {/* Category filters — pick which options to browse below */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 py-1">
                  {(["Top", "Bottom", "Shoes", "Accessory", "Outerwear"] as SlotKey[]).map((key) => {
                    const item = slots[key];
                    const active = activeSlot === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveSlot(key)}
                        className={cn(
                          "shrink-0 h-9 px-4 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5",
                          active
                            ? "bg-ink text-white dark:bg-white dark:text-ink"
                            : "border border-line dark:border-white/15 text-ink-variant dark:text-white/60 hover:bg-surface-dim dark:hover:bg-white/5",
                        )}
                      >
                        {item && (
                          <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-white dark:bg-ink" : "bg-ink dark:bg-white")} />
                        )}
                        {key}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Complete the look header + search */}
              <div className="px-6 mb-2 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display text-title-md font-bold text-ink dark:text-off-white">Complete the look</h2>
                  {outfitHasItems ? (
                    <button onClick={startFresh} className="text-caption text-mid-grey dark:text-white/60 flex items-center gap-1 hover:text-ink dark:hover:text-white active:scale-95 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                      Start fresh
                    </button>
                  ) : (
                    <span className="text-caption text-ink dark:text-off-white/70 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      AI Curated
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-full border border-line dark:border-white/10 bg-surface-low dark:bg-white/5 px-3 h-9">
                  <span className="material-symbols-outlined text-[16px] text-mid-grey dark:text-white/50">search</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${activeSlot.toLowerCase()} products`}
                    className="flex-1 bg-transparent text-caption text-ink dark:text-off-white placeholder:text-mid-grey/70 dark:placeholder:text-white/30 outline-none"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} aria-label="Clear search">
                      <span className="material-symbols-outlined text-[16px] text-mid-grey dark:text-white/50">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Recommendations Grid */}
              <div className="px-6 pb-2 overflow-y-auto no-scrollbar flex-grow">
                <div className="grid grid-cols-2 gap-3">
                  {loadingRecs ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                    ))
                  ) : activeRecs.length === 0 ? (
                    <div className="flex h-40 col-span-2 items-center px-1">
                      <p className="text-caption text-mid-grey dark:text-white/50">
                        No {activeSlot.toLowerCase()} products found.
                      </p>
                    </div>
                  ) : (
                    activeRecs.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => selectRecommendation(toSelectedItem(rec))}
                      className="flex flex-col gap-2 cursor-pointer group"
                    >
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-surface-low dark:bg-white/5 relative">
                        <img
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          src={rec.images?.[0] || ""}
                          alt={rec.name}
                        />
                        <button className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-surface-dark/90 backdrop-blur text-ink dark:text-off-white flex items-center justify-center hover:scale-105 active:scale-95">
                          <span className="material-symbols-outlined text-[18px] font-bold">add</span>
                        </button>
                      </div>
                      <div>
                        <p className="text-label-bold text-ink dark:text-off-white truncate">{rec.name}</p>
                        <p className="text-caption text-mid-grey dark:text-white/60">{ghs(Number(rec.priceGHS))}</p>
                      </div>
                    </div>
                  )))}
                </div>
              </div>
            </>
          )}

          {/* Action Area */}
          <div className="px-6 flex gap-3 mt-auto shrink-0 pb-1 md:pt-4">
            <button
              onClick={tryOnActive ? handleSaveOutfit : handleTryOn}
              className="flex-1 h-btn-lg rounded-full border-2 border-ink dark:border-white/30 text-ink dark:text-white font-sans font-semibold uppercase tracking-[0.08em] text-[13px] flex items-center justify-center gap-2 hover:bg-ink hover:text-white dark:hover:bg-white/10 active:scale-[0.98] transition-all duration-300"
            >
              <span className="material-symbols-outlined text-[20px]">{tryOnActive ? "check_circle" : "photo_camera"}</span>
              {tryOnActive ? "Finish Try-On" : "Try On"}
            </button>
            <button
              onClick={handleAddAllToCart}
              className="flex-1 h-btn-lg rounded-full bg-ink dark:bg-white text-white dark:text-ink font-sans font-semibold uppercase tracking-[0.08em] text-[13px] flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-white/90 active:scale-[0.98] transition-all duration-300"
            >
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              Add to Cart
            </button>
          </div>
        </section>
      </main>

      {/* BottomNav Component */}
      <BottomNav />
    </div>
  );
}
