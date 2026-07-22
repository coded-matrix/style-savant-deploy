"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRYON_COST } from "@/lib/vendor/constants";
import { useVendor } from "@/context/VendorContext";
import { PageHeader, Thumb } from "@/components/vendor/shared";

const PRESETS = ["Model A", "Model B", "Model C", "Model D"];

export default function TryOnPage() {
  const { products, updateProduct, requestSpend, recordUsage, toast, tokens } =
    useVendor();
  const [productId, setProductId] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [custom, setCustom] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const customRef = useRef<HTMLInputElement>(null);

  const prod = products.find((p) => p.id === productId);
  const modelImg = custom ?? model;

  const generate = () => {
    if (!productId || !modelImg) return;
    setGenerating(true);
    requestSpend(
      TRYON_COST,
      () => {
        setTimeout(() => {
          // Mock: create a data URL gradient as try-on result
          const canvas = document.createElement("canvas");
          canvas.width = 200;
          canvas.height = 260;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#F4F3F0"; // surface-bright (bone)
            ctx.fillRect(0, 0, 200, 260);
            ctx.fillStyle = "#141414"; // ink
            ctx.font = "12px sans-serif";
            ctx.fillText("Try-On", 70, 130);
            ctx.font = "10px sans-serif";
            ctx.fillText(prod?.name ?? "", 20, 150);
          }
          setResult(canvas.toDataURL());
          setGenerating(false);
          recordUsage("Virtual Try-On", TRYON_COST);
          toast("Try-on generated!", "success");
        }, 2000);
      },
      "Virtual Try-On",
    );
  };

  const saveToGallery = () => {
    if (!productId || !result) return;
    updateProduct(productId, {
      images: [...(prod?.images ?? []), result],
    });
    toast("Try-on image added to product gallery.", "success");
  };

  return (
    <div>
      <PageHeader
        title="Try-On Preview"
        subtitle="Test how products look before publishing"
      />

      <div className="space-y-6 lg:space-y-8">
        <div className="rounded-xl bg-ink/[0.03] dark:bg-white/[0.03] border border-line dark:border-white/10 px-4 py-3 text-v-body text-ink dark:text-white/90">
          Use this to verify your product renders on a model before going live.
          Each render costs {TRYON_COST} tokens. Balance: {tokens} tokens.
        </div>

        <section>
          <h2 className="mb-2 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">1. Select Product</h2>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="vendor-input"
          >
            <option value="">Choose a product…</option>
            {products
              .filter((p) => p.status === "active" || p.status === "draft")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </section>

        <section>
          <h2 className="mb-2 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">2. Select Model Image</h2>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setModel(m);
                  setCustom(null);
                }}
                className={cn(
                  "flex h-[72px] w-14 flex-col items-center justify-center rounded-md border",
                  model === m
                    ? "border-vendor-coral-bright ring-2 ring-vendor-coral-bright/30"
                    : "border-line dark:border-white/10 bg-white dark:bg-surface-dark",
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-low dark:bg-white/5 text-v-meta font-bold text-mid-grey">
                  {m.slice(-1)}
                </div>
                <span className="mt-1 text-[9px] text-ink dark:text-white/90">{m}</span>
              </button>
            ))}
            <button
              onClick={() => {
                customRef.current?.click();
                setModel(null);
              }}
              className={cn(
                "flex h-[72px] w-14 flex-col items-center justify-center rounded-md border border-dashed",
                custom ? "border-teal bg-vendor-teal-tint" : "border-line dark:border-white/10 bg-white dark:bg-surface-dark",
              )}
            >
              <Upload className="h-5 w-5 text-mid-grey" />
              <span className="mt-1 text-[9px] text-ink dark:text-white/90">Custom</span>
            </button>
            <input
              ref={customRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setCustom(URL.createObjectURL(f));
              }}
            />
          </div>
        </section>

        <button
          disabled={!productId || !modelImg || generating}
          onClick={generate}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-vendor-coral-bright py-3 text-v-tsm font-bold text-white disabled:opacity-40"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Rendering your try-on…
            </>
          ) : (
            `Generate Try-On (${TRYON_COST} tokens)`
          )}
        </button>

        {result ? (
          <div className="rounded-xl border border-line dark:border-white/10 bg-white dark:bg-surface-dark p-5">
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result} alt="Try-on result" className="h-[260px] rounded-xl object-cover border" />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={saveToGallery}
                className="flex flex-1 items-center justify-center gap-1 rounded-full bg-teal py-2.5 text-v-body font-bold text-white"
              >
                <Save className="h-4 w-4" /> Save to Product Gallery
              </button>
              <button
                onClick={() => setResult(null)}
                className="flex items-center gap-1 rounded-full border border-line dark:border-white/10 bg-white dark:bg-surface-dark px-4 py-2.5 text-v-body font-bold text-ink dark:text-white/90"
              >
                <Trash2 className="h-4 w-4" /> Discard
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
