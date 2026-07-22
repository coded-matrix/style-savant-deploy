"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { BackdropTile } from "./BackdropTile";
import { Paywall } from "./Paywall";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { useApp } from "@/lib/consumer/store";
import type { Backdrop } from "@/lib/consumer/types";
import { cn } from "@/lib/utils";

interface BackdropPickerProps {
  open: boolean;
  onClose: () => void;
  onApply: (id: string) => void;
  /** restrict to a single artist */
  artistId?: string;
}

export function BackdropPicker({ open, onClose, onApply, artistId }: BackdropPickerProps) {
  const { allBackdrops, freeBackdrops, premiumBackdrops, ownedBackdropIds, activeBackdropId } = useApp();
  const [tab, setTab] = useState<"Free" | "Premium">("Free");
  const [selected, setSelected] = useState<string>(activeBackdropId);
  const [loading, setLoading] = useState(true);
  const [paywall, setPaywall] = useState<Backdrop | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setSelected(activeBackdropId);
      const t = setTimeout(() => setLoading(false), 600);
      return () => clearTimeout(t);
    }
  }, [open, activeBackdropId]);

  const free = artistId ? allBackdrops.filter((b) => !b.premium && b.artistId === artistId) : freeBackdrops;
  const premium = artistId
    ? allBackdrops.filter((b) => b.premium && b.artistId === artistId)
    : premiumBackdrops;

  const apply = () => {
    onApply(selected);
    onClose();
  };

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Style Backdrops"
        height={65}
        footer={
          <Button variant="coral" full disabled={!selected} onClick={apply}>
            Apply Backdrop
          </Button>
        }
      >
        {/* tabs */}
        <div className="mb-4 flex gap-6 border-b border-line dark:border-white/10">
          {(["Free", "Premium"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "-mb-px border-b-2 pb-2.5 font-display text-sm font-bold transition-colors",
                tab === t ? "border-coral text-ink dark:text-off-white" : "border-transparent text-mid-grey dark:text-white/50"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[5/6] w-full rounded-card" />
                <Skeleton className="mt-1.5 h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : tab === "Free" ? (
          free.length === 0 ? (
            <EmptyState
              illustration="frame"
              headline="Backdrops coming soon from this artist."
              cta={
                <Button variant="tealOutline" full onClick={() => setTab("Premium")}>
                  Browse free backdrops
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {free.map((b) => (
                <BackdropTile
                  key={b.id}
                  backdrop={b}
                  selected={selected === b.id}
                  onClick={() => setSelected(b.id)}
                />
              ))}
            </div>
          )
        ) : premium.length === 0 ? (
          <EmptyState illustration="frame" headline="Artist collections coming soon." />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {premium.map((b) => (
              <BackdropTile
                key={b.id}
                backdrop={b}
                owned={ownedBackdropIds.includes(b.id)}
                selected={selected === b.id}
                onClick={() =>
                  ownedBackdropIds.includes(b.id)
                    ? setSelected(b.id)
                    : setPaywall(b)
                }
              />
            ))}
          </div>
        )}
      </BottomSheet>

      <Paywall
        open={!!paywall}
        backdrop={paywall}
        onClose={() => setPaywall(null)}
        onUse={(id) => setSelected(id)}
      />
    </>
  );
}
