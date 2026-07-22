"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/consumer/store";
import { ghs } from "@/lib/consumer/format";
import { SmartImage } from "./SmartImage";
import { SizeSelector } from "./SizeSelector";
import { Button, TextLink } from "./Button";
import { catalogApi } from "@/lib/api/catalog";
import type { Product, Size } from "@/lib/consumer/types";

interface TryOnProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onChangeProduct?: (p: Product) => void;
}

export function TryOnSheet({ open, product, onClose, onChangeProduct }: TryOnProps) {
  const router = useRouter();
  const { addToCart, saveLook, toast, user, activeBackdropId, cartCount, backdropById, productsByVendor } = useApp();
  const [rendering, setRendering] = useState(true);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [size, setSize] = useState<Size | undefined>();
  const [color, setColor] = useState<string | undefined>();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [cartState, setCartState] = useState<"idle" | "adding" | "added">("idle");
  const [trayOpen, setTrayOpen] = useState(false);

  const backdrop = backdropById(activeBackdropId);
  const hasFitProfile = !!user.fitProfile?.photo || !!user.fitProfile?.modelId;
  const recommended: Size | undefined = user.fitProfile?.sizes?.Top ?? "M";

  useEffect(() => {
    if (open && !user.fitProfile?.photo) {
      onClose();
      toast("Please upload a photo of yourself to use the try-on feature.", "neutral");
      router.push(`/savant/profile/upload?returnUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [open, user.fitProfile?.photo, router, onClose, toast]);

  useEffect(() => {
    if (open && product && user.fitProfile?.photo) {
      setRendering(true);
      setTryOnImage(null);
      setSlow(false);
      setCollapsed(false);
      setSize(undefined);
      setColor(product.colors?.[0]?.name);
      setSaveState("idle");
      setCartState("idle");
      setTrayOpen(false);

      // Kick off the real AI try-on. The product image shows immediately as a
      // preview; when Agnes returns we crossfade to the generated look. If it
      // fails (or takes too long and the user skips), we keep the product image.
      let cancelled = false;
      const slowT = setTimeout(() => !cancelled && setSlow(true), 8000);

      catalogApi
        .tryOnProduct(product.id, product.clothImages?.[0] || product.images?.[0])
        .then((res) => {
          if (cancelled) return;
          setTryOnImage(`data:image/jpeg;base64,${res.image}`);
          setRendering(false);
        })
        .catch(() => {
          if (cancelled) return;
          toast("Couldn't create your try-on. Showing the item instead.", "neutral");
          setRendering(false);
        });

      return () => {
        cancelled = true;
        clearTimeout(slowT);
      };
    }
  }, [open, product, user.fitProfile?.photo, toast]);

  const others = product ? productsByVendor(product.vendorId).filter((p) => p.id !== product.id) : [];
  const oosForSize = size && product ? product.stockBySize?.[size] === false : false;

  const handleAdd = () => {
    if (!product) return;
    if (oosForSize) {
      toast("We'll notify you when it's back.", "neutral");
      return;
    }
    if (!size) {
      toast("Please select a size.", "warn");
      return;
    }
    setCartState("adding");
    setTimeout(() => {
      addToCart(product.id, size, color);
      setCartState("added");
      toast(`${product.name} added to cart`, "success");
      setTimeout(() => setCartState("idle"), 1500);
    }, 900);
  };

  const handleSave = () => {
    if (!product) return;
    setSaveState("saving");
    setTimeout(() => {
      saveLook({
        id: `my-${Date.now()}`,
        userId: "me",
        username: user.username,
        avatar: user.avatar,
        image: tryOnImage ?? product.images[0],
        caption: "",
        votes: 0,
        leadProductId: product.id,
        productIds: [product.id],
        backdropId: activeBackdropId,
        createdAt: new Date().toISOString(),
        isMine: true,
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    }, 800);
  };

  return (
    <AnimatePresence>
      {open && product && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="absolute inset-0 z-50 flex flex-col bg-studio-black"
        >
      {/* backdrop layer */}
      <SmartImage
        src={backdrop?.image ?? ""}
        alt={backdrop?.name ?? "backdrop"}
        seed={backdrop?.id ?? "bg"}
        label={backdrop?.name ?? "S"}
        fill
      />
      <div className="absolute inset-0 bg-black/15" />

      {/* top bar */}
      <div className="relative z-10 flex h-14 items-center justify-between px-page-x pt-safe">
        <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-black/30 text-white">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        <span className="font-display text-sm font-bold text-white">Try-On</span>
        <button
          onClick={() => setTrayOpen((v) => !v)}
          className="font-display text-sm font-bold text-teal-dim"
        >
          Change Item
        </button>
      </div>

      {/* try-on render area */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-8">
        <div className="relative h-[62%] w-full max-w-[300px] animate-scale-in overflow-hidden rounded-card shadow-2xl ring-1 ring-white/20">
          {tryOnImage ? (
            // Generated look — a real image URL, so use a plain <img> (SmartImage
            // is for seeded/placeholder catalog art, not data URIs).
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tryOnImage} alt={`You wearing ${product.name}`} className="h-full w-full object-cover" />
          ) : (
            <SmartImage src={product.images[0]} alt={product.name} seed={product.id} label={product.name} fill />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {rendering && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[2px]">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
              <p className="mt-4 font-display text-sm font-bold text-white">Generating your look…</p>
              {slow && (
                <button
                  onClick={() => setRendering(false)}
                  className="mt-3 rounded-pill bg-white/90 px-4 py-1.5 font-display text-[12px] font-bold text-ink"
                >
                  This is taking longer than usual… View without try-on
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* change-item tray */}
      <AnimatePresence>
        {trayOpen && others.length > 0 && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 500, damping: 45 }}
            className="relative z-20 max-h-[40%] overflow-y-auto rounded-t-sheet bg-white dark:bg-surface-dark px-page-x pb-4 pt-3"
          >
            <p className="mb-2 font-display text-sm font-bold text-ink dark:text-white">More from {product.vendorName}</p>
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {others.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onChangeProduct?.(p);
                    setTrayOpen(false);
                  }}
                  className="w-[88px] shrink-0 text-left"
                >
                  <span className="block aspect-[4/5] overflow-hidden rounded-card ring-1 ring-line">
                    <SmartImage src={p.images[0]} alt={p.name} seed={p.id} className="h-full w-full" />
                  </span>
                  <span className="mt-1 block truncate text-[11px] font-bold text-ink dark:text-white">{p.name}</span>
                  <span className="block text-[11px] text-teal dark:text-teal-dim">{ghs(p.priceGHS)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* bottom panel */}
      <div
        className={cn(
          "relative z-20 rounded-t-sheet bg-white dark:bg-canvas-dark shadow-2xl transition-all duration-300",
          collapsed ? "h-[68px]" : "h-[44%] min-h-[300px]"
        )}
      >
        {/* drag / collapse handle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full justify-center pt-2.5"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          <span className={cn("material-symbols-outlined text-[20px] text-mid-grey dark:text-white/60 transition-transform", collapsed && "rotate-180")}>expand_more</span>
        </button>

        {!collapsed ? (
          <div className="no-scrollbar flex flex-col gap-3 overflow-y-auto px-page-x pb-4">
            {!hasFitProfile && (
              <button
                onClick={() => {
                  onClose();
                  router.push("/savant/profile");
                }}
                className="flex items-center justify-between rounded-card bg-teal/10 px-3 py-2 text-left text-sm font-bold text-teal"
              >
                Add your photo for a personalised try-on
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            )}

            <div className="flex items-center gap-3">
              <span className="h-16 w-16 shrink-0 overflow-hidden rounded-card ring-1 ring-line">
                <SmartImage src={product.images[0]} alt={product.name} seed={product.id} className="h-full w-full" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[14px] font-bold text-ink dark:text-white">{product.name}</p>
                <p className="truncate text-[12px] text-mid-grey dark:text-white/50">{product.vendorName}</p>
                <p className="mt-0.5 font-display text-title-lg font-bold text-ink dark:text-white">{ghs(product.priceGHS)}</p>
              </div>
            </div>

            <SizeSelector
              product={product}
              value={size}
              onChange={setSize}
              recommended={recommended}
              showRecommendedLabel
              selectedTone="teal"
            />

            {product.colors && product.colors.length > 1 && (
              <div>
                <p className="mb-1.5 font-display text-label-bold text-ink dark:text-white">Colour</p>
                <div className="flex gap-2.5">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setColor(c.name)}
                      aria-label={c.name}
                      className={cn(
                        "h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-canvas-dark transition-all",
                        color === c.name ? "ring-coral" : "ring-transparent"
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="tealOutline"
                size="md"
                className="flex-1"
                loading={saveState === "saving"}
                onClick={handleSave}
              >
                {saveState === "saved" ? (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check</span> Saved!
                  </>
                ) : (
                  "Save Look"
                )}
              </Button>
              <Button
                variant="coral"
                size="md"
                className="flex-1"
                loading={cartState === "adding"}
                onClick={handleAdd}
              >
                {oosForSize ? "Notify Me" : cartState === "added" ? "Added!" : "Add to Cart"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-page-x">
            <p className="truncate text-center font-display text-sm font-bold text-ink dark:text-white">{product.name}</p>
            <div className="mt-2">
              <Button variant="coral" size="md" full loading={cartState === "adding"} onClick={handleAdd}>
                {cartState === "added" ? "Added!" : "Add to Cart"}
              </Button>
            </div>
          </div>
        )}
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
