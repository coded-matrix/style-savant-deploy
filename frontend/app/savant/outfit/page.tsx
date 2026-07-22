"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/consumer/store";
import { ghs } from "@/lib/consumer/format";
import { TopBar } from "@/components/consumer/TopBar";
import { SmartImage } from "@/components/consumer/SmartImage";
import { Button, TextLink } from "@/components/consumer/Button";
import { BackdropPicker } from "@/components/consumer/BackdropPicker";
import type { OutfitSlot, Product, Size } from "@/lib/consumer/types";

const SLOTS: OutfitSlot[] = ["Top", "Bottom", "Shoes", "Accessory", "Outerwear"];

const SUGGESTIONS: Record<OutfitSlot, string[]> = {
  Top: ["p1", "p4", "p6"],
  Bottom: ["p2", "p4"],
  Shoes: ["p10"],
  Accessory: ["p3", "p5", "p11"],
  Outerwear: ["p12", "p1"],
};

export default function OutfitBuilderPage() {
  const router = useRouter();
  const { activeBackdropId, addToCart, saveLook, user, toast, backdropById, productById } = useApp();
  const [slots, setSlots] = useState<Partial<Record<OutfitSlot, Product>>>({});
  const [activeSlot, setActiveSlot] = useState<OutfitSlot>("Top");
  const [bpOpen, setBpOpen] = useState(false);
  const [removing, setRemoving] = useState<OutfitSlot | null>(null);
  const [rendering, setRendering] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const backdrop = backdropById(activeBackdropId);
  const filledSlots = Object.values(slots).filter(Boolean) as Product[];
  const allFilled = filledSlots.length === SLOTS.length;

  const suggestions = useMemo(() => {
    const ids = SUGGESTIONS[activeSlot];
    const list = ids.map((id) => productById(id)).filter(Boolean) as Product[];
    // remove items already placed in any slot
    const placedIds = new Set(Object.values(slots).filter(Boolean).map((p) => p!.id));
    return list.filter((p) => !placedIds.has(p.id));
  }, [activeSlot, slots]);

  const placeItem = (p: Product) => {
    setRendering(true);
    setSlots((prev) => {
      const next = { ...prev, [activeSlot]: p };
      setTimeout(() => {
        setRendering(false);
        if (Object.values(next).filter(Boolean).length === SLOTS.length) {
          setConfetti(true);
          setTimeout(() => setConfetti(false), 2500);
        }
      }, 700);
      return next;
    });
  };

  const removeSlot = (s: OutfitSlot) => {
    setSlots((prev) => {
      const n = { ...prev };
      delete n[s];
      return n;
    });
    setRemoving(null);
  };

  const addAllToCart = () => {
    if (filledSlots.length === 0) return;
    filledSlots.forEach((p) => {
      const size = (p.sizes.includes("M") ? "M" : p.sizes[0]) as Size;
      addToCart(p.id, size, p.colors?.[0]?.name);
    });
    toast(`${filledSlots.length} items added to cart`, "success");
  };

  const saveOutfit = () => {
    if (user.isGuest) {
      router.push("/savant/auth");
      return;
    }
    if (filledSlots.length === 0) {
      toast("Add at least one item to save an outfit.", "warn");
      return;
    }
    const lead = filledSlots[0];
    saveLook({
      id: `outfit-${Date.now()}`,
      userId: "me",
      username: user.username,
      avatar: user.avatar,
      image: lead.images[0],
      caption: "My outfit",
      votes: 0,
      leadProductId: lead.id,
      productIds: filledSlots.map((p) => p.id),
      backdropId: activeBackdropId,
      createdAt: new Date().toISOString(),
      isMine: true,
    });
    toast("Outfit saved to your profile.", "success");
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-canvas-dark">
      <TopBar
        title="Build Your Fit"
        backHref="/savant/feed"
        right={<TextLink onClick={saveOutfit}>Save</TextLink>}
      />

      {/* canvas (upper ~55%) */}
      <div className="relative h-[42%] min-h-[260px] w-full overflow-hidden bg-studio-black">
        <SmartImage
          src={backdrop?.image ?? ""}
          alt="backdrop"
          seed={`outfit-${activeBackdropId}`}
          label="S"
          fill
        />
        <div className="absolute inset-0 bg-black/20" />
        {/* layered outfit render */}
        <div className="absolute inset-0 flex items-center justify-center">
          {filledSlots.length === 0 ? (
            <div className="text-center">
              <span className="material-symbols-outlined mx-auto text-[32px] text-white/70">auto_awesome</span>
              <p className="mt-2 font-display text-sm font-bold text-white/80">Pick items to build your fit</p>
            </div>
          ) : (
            <div className="flex h-[80%] flex-col items-center gap-1.5 animate-fade-in">
              {["Outerwear", "Top", "Bottom", "Shoes", "Accessory"]
                .map((s) => slots[s as OutfitSlot])
                .filter(Boolean)
                .map((p, i) => (
                  <div
                    key={`${p!.id}-${i}`}
                    className="h-[60px] w-[60px] overflow-hidden rounded-card ring-1 ring-white/30"
                  >
                    <SmartImage src={p!.images[0]} alt={p!.name} seed={p!.id} className="h-full w-full" />
                  </div>
                ))}
            </div>
          )}
          {rendering && <div className="shimmer absolute inset-0" />}
        </div>
        {/* backdrop change */}
        <button
          onClick={() => setBpOpen(true)}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white"
          aria-label="Change backdrop"
        >
          <span className="material-symbols-outlined text-[20px]">image</span>
        </button>

        {confetti && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className={`absolute top-0 h-2 w-2 animate-confetti ${i % 2 ? "bg-ink dark:bg-white" : "bg-off-white"}`}
                style={{
                  left: `${(i * 4.2) % 100}%`,
                  animationDelay: `${(i % 8) * 80}ms`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* lower panel */}
      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-page-x pb-4">
        {/* slot row */}
        <div className="no-scrollbar -mx-page-x mt-4 flex gap-3 overflow-x-auto px-page-x">
          {SLOTS.map((s) => {
            const filled = slots[s];
            const active = activeSlot === s;
            return (
              <div key={s} className="flex shrink-0 flex-col items-center gap-1">
                <button
                  onClick={() => setActiveSlot(s)}
                  onPointerDown={() => setRemoving(null)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (filled) setRemoving(s);
                  }}
                  className={cn(
                    "relative grid h-16 w-16 place-items-center overflow-hidden rounded-card border-2 transition-all",
                    active ? "border-teal" : "border-line dark:border-white/10",
                    filled ? "bg-white dark:bg-surface-dark" : "bg-surface-low dark:bg-white/5"
                  )}
                >
                  {filled ? (
                    <SmartImage src={filled.images[0]} alt={filled.name} seed={filled.id} className="h-full w-full" />
                  ) : (
                    <span className="material-symbols-outlined text-[24px] text-mid-grey dark:text-white/60">add</span>
                  )}
                </button>
                <span
                  className={cn(
                    "text-[11px] font-bold",
                    active ? "text-teal" : "text-mid-grey dark:text-white/60"
                  )}
                >
                  {s}
                </span>
                {removing === s && filled && (
                  <button
                    onClick={() => removeSlot(s)}
                    className="inline-flex items-center gap-1 rounded-pill bg-error/10 px-2 py-0.5 text-[10px] font-bold text-error"
                  >
                    <span className="material-symbols-outlined text-[12px]">delete</span> Remove from fit
                  </button>
                )}
                {filled && removing !== s && (
                  <button
                    onClick={() => setRemoving(s)}
                    className="text-[10px] font-bold text-mid-grey dark:text-white/60"
                  >
                    hold to remove
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* suggestions */}
        <div className="mt-5">
          <p className="font-display text-sm font-bold text-ink dark:text-off-white">
            Suggested to complete your fit · <span className="text-teal">{activeSlot}</span>
          </p>
          {suggestions.length === 0 ? (
            <button
              onClick={() => router.push("/savant/explore")}
              className="mt-3 font-display text-sm font-bold text-teal"
            >
              Explore more {activeSlot} →
            </button>
          ) : (
            <div className="no-scrollbar -mx-page-x mt-3 flex gap-3 overflow-x-auto px-page-x pb-1">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => placeItem(p)}
                  className="w-[80px] shrink-0 text-left"
                >
                  <span className="block aspect-[4/5] overflow-hidden rounded-card ring-1 ring-line dark:ring-white/10">
                    <SmartImage src={p.images[0]} alt={p.name} seed={p.id} className="h-full w-full" />
                  </span>
                  <span className="mt-1 block truncate text-[11px] font-bold text-ink dark:text-off-white">{p.name}</span>
                  <span className="block text-[11px] font-bold text-teal">{ghs(p.priceGHS)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* bottom actions */}
        <div className="mt-auto space-y-2.5 pt-5">
          <Button variant="coral" full disabled={filledSlots.length === 0} onClick={addAllToCart}>
            Add All to Cart{filledSlots.length > 0 ? ` (${filledSlots.length})` : ""}
          </Button>
          <Button variant="tealOutline" full onClick={saveOutfit}>
            Save Outfit
          </Button>
        </div>
      </div>

      <BackdropPicker open={bpOpen} onClose={() => setBpOpen(false)} onApply={() => toast("Backdrop applied.", "success")} />
    </div>
  );
}
