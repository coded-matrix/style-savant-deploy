"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { Button, TextLink } from "./Button";
import { Chip } from "./Chip";
import { SmartImage } from "./SmartImage";
import { Skeleton } from "./Skeleton";
import { useApp } from "@/lib/consumer/store";
import { ghs } from "@/lib/consumer/format";
import type { Backdrop } from "@/lib/consumer/types";

interface PaywallProps {
  open: boolean;
  backdrop: Backdrop | null;
  onClose: () => void;
  onUse?: (id: string) => void;
}

export function Paywall({ open, backdrop, onClose, onUse }: PaywallProps) {
  const { ownedBackdropIds, purchaseBackdrop, toast, artistById } = useApp();
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"idle" | "buying" | "success">("idle");

  useEffect(() => {
    if (open && backdrop) {
      setLoading(true);
      setPhase("idle");
      const t = setTimeout(() => setLoading(false), 700);
      return () => clearTimeout(t);
    }
  }, [open, backdrop]);

  if (!backdrop) return null;
  const owned = ownedBackdropIds.includes(backdrop.id);
  const artist = backdrop.artistId ? artistById(backdrop.artistId) : undefined;
  const originalAvailable = (artist?.originalWorks?.length ?? 0) > 0;

  const buy = () => {
    setPhase("buying");
    setTimeout(() => {
      purchaseBackdrop(backdrop.id);
      setPhase("success");
      toast("Backdrop unlocked!", "success");
    }, 1600);
  };

  const useNow = () => {
    onUse?.(backdrop.id);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      height={70}
      bare
      lockDismiss={phase === "buying"}
      footer={
        phase === "success" ? (
          <div className="space-y-2">
            <Button variant="coral" full onClick={useNow}>
              Use it now →
            </Button>
            <button
              onClick={onClose}
              className="w-full text-center font-display text-sm font-bold text-teal"
            >
              Continue browsing
            </button>
          </div>
        ) : owned ? (
          <Button variant="teal" full onClick={useNow}>
            Already in your collection — Use it now
          </Button>
        ) : (
          <div className="space-y-2.5">
            <Button variant="coral" full loading={phase === "buying"} onClick={buy}>
              {phase === "buying" ? "Processing…" : "Unlock This Backdrop"}
            </Button>
            {originalAvailable && (
              <TextLink className="block w-full text-center" onClick={onClose}>
                Or buy the original artwork
              </TextLink>
            )}
            <p className="text-center text-caption text-mid-grey">
              Secure payment via Paystack. Your backdrop is available instantly after purchase.
            </p>
          </div>
        )
      }
    >
      <div className="flex items-center justify-end pb-1">
        <button onClick={onClose} className="text-mid-grey hover:text-ink dark:hover:text-off-white" aria-label="Close">
          ✕
        </button>
      </div>

      {phase === "success" ? (
        <div className="flex flex-col items-center px-2 py-8 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-success/15">
            <span className="material-symbols-outlined text-[40px] text-success">check</span>
          </div>
          <p className="mt-4 font-serif text-headline-md text-ink">Backdrop unlocked!</p>
          <p className="mt-1 text-body-md text-mid-grey">{backdrop.name} is now in your collection.</p>
        </div>
      ) : (
        <>
          {/* preview */}
          <div className="relative h-[200px] w-full overflow-hidden rounded-card">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <SmartImage
                src={backdrop.image}
                alt={backdrop.name}
                seed={backdrop.id}
                label={backdrop.name}
                fill
              />
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-2.5 left-3 font-display text-[12px] font-bold text-white">
              {backdrop.artistName}
            </span>
          </div>

          {/* title + artist */}
          {loading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <>
              <h2 className="mt-4 font-serif text-title-lg text-ink">{backdrop.name}</h2>
              <p className="mt-0.5 text-body-md text-mid-grey">
                by{" "}
                <span className="font-bold text-teal">{backdrop.artistName}</span>
              </p>
            </>
          )}

          {/* licence chips */}
          <div className="mt-5 flex gap-2.5">
            <span className="inline-flex items-center rounded-pill border-2 border-teal px-3 py-1.5 font-display text-[12px] font-bold text-teal">
              Personal Use
            </span>
            <span className="inline-flex items-center rounded-pill bg-coral px-3 py-1.5 font-display text-[12px] font-bold text-white">
              Commercial Sharing
            </span>
          </div>

          {/* price */}
          {loading ? (
            <Skeleton className="mt-5 h-8 w-32" />
          ) : (
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-[24px] font-bold text-coral">
                {ghs(backdrop.priceGHS ?? 0)}
              </span>
              <span className="inline-flex items-center gap-1 text-caption text-mid-grey">
                <span className="material-symbols-outlined text-[12px]">lock</span> one-time unlock
              </span>
            </div>
          )}
        </>
      )}
    </BottomSheet>
  );
}
