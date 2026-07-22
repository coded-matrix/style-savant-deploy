"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { catalogApi } from "@/lib/api/catalog";
import { useApp } from "@/lib/consumer/store";
import { Button } from "@/components/consumer/Button";
import { SmartImage } from "@/components/consumer/SmartImage";
import { Skeleton } from "@/components/consumer/Skeleton";
import { CurtainReveal } from "@/components/consumer/CurtainReveal";
import { BottomNav } from "@/components/consumer/BottomNav";
import { EASE } from "@/lib/consumer/motion";
import type { GalleryItem } from "@/lib/consumer/types";

export default function GalleryPage() {
  const router = useRouter();
  const { toast } = useApp();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalogApi
      .getGallery()
      .then(setItems)
      .catch(() => toast("Failed to load gallery.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (item: GalleryItem) => {
    try {
      await catalogApi.deleteGalleryItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast("Removed from gallery.", "success");
    } catch {
      toast("Failed to remove item.", "error");
    }
  };

  return (
    <div className="flex h-full flex-col bg-surface-lowest dark:bg-canvas-dark">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between bg-white px-page-x py-4 border-b border-line dark:bg-canvas-dark">
        <button
          onClick={() => router.back()}
          className="text-ink dark:text-off-white hover:opacity-80 active:scale-95 transition-transform p-2 -ml-2"
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_left</span>
        </button>
        <h1 className="text-[11px] uppercase tracking-[0.28em] font-medium text-ink dark:text-off-white">My Gallery</h1>
        <span className="w-9" />
      </header>

      {/* Content */}
      <main className="no-scrollbar flex-1 overflow-y-auto px-page-x md:px-16 lg:px-24 py-4 w-full max-w-[1440px] mx-auto">
        <div className="pt-8 md:pt-16 pb-8 md:pb-12">
          <div className="text-[11px] uppercase tracking-[0.24em] text-mid-grey dark:text-white/60 mb-3">Saved try-ons</div>
          <h2 className="font-serif text-4xl md:text-6xl leading-[0.95] tracking-[-0.02em] font-normal text-ink dark:text-off-white">My gallery.</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-[48px] text-mid-grey dark:text-white/60">photo_library</span>
            <h2 className="mt-4 font-display text-headline-md text-ink dark:text-off-white">No saved try-ons yet</h2>
            <p className="mt-2 font-body text-body-md text-mid-grey dark:text-white/60">
              Try on an outfit in the Studio and it will appear here.
            </p>
            <Button
              variant="tealOutline"
              size="md"
              className="mt-6"
              onClick={() => router.push("/savant/studio")}
            >
              Go to Studio
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: (index % 4) * 0.06, duration: 0.5, ease: EASE.out }}
              >
              <div className="group relative overflow-hidden rounded-card bg-white dark:bg-surface-dark ring-1 ring-line/50 dark:ring-white/10 transition-shadow hover:ring-ink/30">
                <div className="aspect-[3/4]">
                  <CurtainReveal delay={0.1} duration={0.7}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 1.4, ease: EASE.out }}
                      className="h-full w-full"
                    >
                    <img
                      src={`data:image/jpeg;base64,${item.imageBase64}`}
                      alt={`Try-on with ${item.productName}`}
                      className="h-full w-full object-cover"
                    />
                    </motion.div>
                  </CurtainReveal>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-2.5">
                  <p className="truncate font-serif text-[15px] font-normal leading-tight text-white">
                    {item.productName}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-white/60">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {/* Delete button — visible on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Delete"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}