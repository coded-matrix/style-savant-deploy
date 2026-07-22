"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useApp } from "@/lib/consumer/store";
import { timeAgo } from "@/lib/consumer/format";
import { TopBar } from "@/components/consumer/TopBar";
import { Button } from "@/components/consumer/Button";
import { SmartImage } from "@/components/consumer/SmartImage";
import { EmptyState } from "@/components/consumer/EmptyState";
import { ProductCard } from "@/components/consumer/ProductCard";
import { BottomSheet } from "@/components/consumer/BottomSheet";
import { BottomNav } from "@/components/consumer/BottomNav";
import type { Look } from "@/lib/consumer/types";

export default function SavedLooksPage() {
  const router = useRouter();
  const { savedLooks, deleteSavedLook, likedProductIds, products, toast } = useApp();
  const [tab, setTab] = useState<"Looks" | "Wishlist">("Looks");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [longPress, setLongPress] = useState<string | null>(null);

  const wishlist = products.filter((p) => likedProductIds.includes(p.id));

  const shareLook = async (l: Look) => {
    if (navigator.share) {
      try { await navigator.share({ title: "My Style Savant look", text: l.caption }); } catch { /* cancelled */ }
    } else toast("Share link copied.", "success");
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-canvas-dark">
      <TopBar title="My Looks" backHref="/savant/profile" />

      {/* tabs */}
      <div className="flex shrink-0 gap-6 border-b border-line dark:border-white/10 px-page-x md:px-16 lg:px-24">
        {(["Looks", "Wishlist"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 pb-2.5 font-display text-sm font-bold transition-colors",
              tab === t ? "border-ink text-ink dark:text-off-white" : "border-transparent text-mid-grey dark:text-white/60"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-card-x md:px-16 lg:px-24 pt-3 pb-4 w-full max-w-[1440px] mx-auto">
        {tab === "Looks" ? (
          savedLooks.length === 0 ? (
            <EmptyState
              illustration="sparkle"
              headline="No looks saved yet. Create one in Studio."
              cta={<Button variant="coral" full onClick={() => router.push("/savant/feed")}>Go to Studio</Button>}
            />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
              {savedLooks.map((l, index) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                <div
                  onPointerDown={() => {
                    const t = setTimeout(() => setLongPress(l.id), 600);
                    const up = () => { clearTimeout(t); window.removeEventListener("pointerup", up); };
                    window.addEventListener("pointerup", up);
                  }}
                  className="relative overflow-hidden rounded-card ring-1 ring-line dark:ring-white/10"
                >
                  <span className="block aspect-[4/5] w-full overflow-hidden">
                    <SmartImage src={l.image} alt={l.caption} seed={l.id} label="look" fill />
                  </span>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2">
                    <span className="text-[11px] font-bold text-white/90">{timeAgo(l.createdAt)}</span>
                    <button onClick={() => shareLook(l)} aria-label="Share" className="text-white">
                      <span className="material-symbols-outlined text-[16px]">share</span>
                    </button>
                  </div>
                  {longPress === l.id && (
                    <button
                      onClick={() => setConfirmDel(l.id)}
                      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-pill bg-error px-2 py-1 text-[10px] font-bold text-white"
                    >
                      <span className="material-symbols-outlined text-[12px]">delete</span> Delete look
                    </button>
                  )}
                </div>
                </motion.div>
              ))}
            </div>
          )
        ) : wishlist.length === 0 ? (
          <EmptyState
            illustration="heart"
            headline="Nothing here yet. Heart items in the feed to save them."
            cta={<Button variant="tealOutline" full onClick={() => router.push("/savant/explore")}>Explore products</Button>}
          />
        ) : (
          <ul className="space-y-3">
            {wishlist.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
              <li className="flex gap-3 rounded-card bg-white dark:bg-surface-dark p-2 ring-1 ring-line dark:ring-white/10">
                <span className="h-[100px] w-[75px] shrink-0 overflow-hidden rounded-card">
                  <SmartImage src={p.images[0]} alt={p.name} seed={p.id} className="h-full w-full" />
                </span>
                <div className="min-w-0 flex-1 py-1">
                  <p className="font-display text-[13px] font-bold text-ink dark:text-off-white">{p.name}</p>
                  <p className="text-[12px] text-mid-grey dark:text-white/60">{p.vendorName}</p>
                  <p className="mt-1 font-serif text-sm font-normal tabular-nums tracking-[0.08em] text-ink dark:text-off-white">GHS {p.priceGHS}</p>
                  <button onClick={() => router.push(`/savant/product/${p.id}`)} className="mt-1 text-[11px] uppercase tracking-[0.24em] link-wipe text-ink dark:text-off-white font-medium">
                    View item →
                  </button>
                </div>
              </li>
              </motion.div>
            ))}
          </ul>
        )}
      </div>

      <BottomSheet
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        height={38}
        bare
        fitContent
        footer={
          <div className="flex gap-3">
            <Button variant="greyOutline" className="flex-1" onClick={() => setConfirmDel(null)}>Cancel</Button>
            <Button variant="coral" className="flex-1" onClick={() => { if (confirmDel) { deleteSavedLook(confirmDel); toast("Look deleted.", "neutral"); } setConfirmDel(null); setLongPress(null); }}>
              Delete
            </Button>
          </div>
        }
      >
        <div className="px-2 pt-4 text-center">
          <p className="font-display text-title-md text-ink dark:text-off-white">Delete this look?</p>
          <p className="mt-1 text-body-md text-mid-grey dark:text-white/60">This can&apos;t be undone.</p>
        </div>
      </BottomSheet>
      <BottomNav />
    </div>
  );
}
