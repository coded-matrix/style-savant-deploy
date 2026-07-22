"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/consumer/store";
import { ghs } from "@/lib/consumer/format";
import { SmartImage } from "./SmartImage";
import { Button } from "./Button";
import type { Product, Size } from "@/lib/consumer/types";

interface AddToCartSlideOverProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  selectedSize?: Size;
}

export function AddToCartSlideOver({ product, open, onClose, selectedSize }: AddToCartSlideOverProps) {
  const { addToCart } = useApp();
  const reduce = useReducedMotion();

  const handleAdd = () => {
    const size = (selectedSize ?? (product.sizes.includes("M") ? "M" : product.sizes[0])) as Size;
    addToCart(product.id, size, product.colors?.[0]?.name);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* slide-over panel */}
          <motion.div
            initial={reduce ? {} : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reduce ? {} : { y: "100%" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white dark:bg-surface-dark ring-1 ring-line dark:ring-white/10"
          >
            {/* handle */}
            <div className="flex justify-center pt-3 pb-1">
              <span className="h-1 w-10 rounded-full bg-line" />
            </div>

            {/* product preview */}
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-low ring-1 ring-line">
                <SmartImage
                  src={product.images[0]}
                  alt={product.name}
                  seed={product.id}
                  label={product.name}
                  className="h-full w-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="truncate font-serif text-[18px] font-normal text-ink">{product.name}</h3>
                <p className="mt-0.5 truncate text-[13px] text-mid-grey">{product.vendorName}</p>
                <p className="mt-1 font-body text-[16px] font-normal tabular-nums tracking-wide text-ink">{ghs(product.priceGHS)}</p>
              </div>
            </div>

            {/* size / color selectors if needed */}
            <div className="px-6 pb-2">
              {selectedSize && (
                <p className="text-[13px] text-mid-grey">Size: <span className="font-bold text-ink">{selectedSize}</span></p>
              )}
            </div>

            {/* CTA */}
            <div className="mt-auto border-t border-line px-6 py-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]">
              <Button
                variant="coral"
                full
                onClick={handleAdd}
              >
                Add to Cart — {ghs(product.priceGHS)}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
