"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Upload, Sparkles, X, GripVertical, Loader2, Plus, Wand2, Check, RefreshCw, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVendor } from "@/context/VendorContext";
import { uploadApi } from "@/lib/api/upload";
import { catalogApi } from "@/lib/api/catalog";
import { hasAuthToken, vendorApi } from "@/lib/api/vendor";
import { POLISH_COST } from "@/lib/vendor/constants";
import { ConfirmDialog, Thumb, PageHeader } from "@/components/vendor/shared";
import type { Product } from "@/lib/vendor/types";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Custom"];
const CATEGORIES = ["Tops", "Bottoms", "Dresses", "Shoes"];

/** Style-discovery questions for AI model-image generation (skippable + custom). */
interface ModelQuestion {
  id: string;
  question: string;
  options: { label: string; phrase: string }[];
}
const MODEL_QUESTIONS: ModelQuestion[] = [
  {
    id: "vibe",
    question: "Overall vibe?",
    options: [
      { label: "Editorial & minimal", phrase: "editorial, minimal styling with quiet luxury" },
      { label: "Warm & natural", phrase: "warm, natural and approachable styling" },
      { label: "Bold & vibrant", phrase: "bold, vibrant and confident styling" },
      { label: "Street & modern", phrase: "modern streetwear styling with urban edge" },
    ],
  },
  {
    id: "setting",
    question: "Background?",
    options: [
      { label: "Clean studio", phrase: "a clean seamless studio backdrop" },
      { label: "Outdoor daylight", phrase: "an outdoor setting in soft natural daylight" },
      { label: "Textured wall", phrase: "a subtle textured wall backdrop" },
      { label: "Lifestyle scene", phrase: "a tasteful real-world lifestyle scene" },
    ],
  },
  {
    id: "framing",
    question: "Framing?",
    options: [
      { label: "Full body", phrase: "a full-body shot" },
      { label: "Three-quarter", phrase: "a three-quarter length shot" },
      { label: "Upper body", phrase: "an upper-body / portrait shot" },
    ],
  },
  {
    id: "model",
    question: "Model look?",
    options: [
      { label: "African, elegant", phrase: "an elegant model of African descent" },
      { label: "Diverse", phrase: "a diverse contemporary model" },
      { label: "Youthful", phrase: "a youthful, energetic model" },
    ],
  },
];

interface GenAnswer {
  label: string;
  phrase: string;
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = !!product;
  const { addProduct, updateProduct, deleteProduct, archiveProduct, requestSpend, toast, recordUsage } =
    useVendor();

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [category, setCategory] = useState(product?.category ?? "Tops");
  const [stock, setStock] = useState(product ? String(product.stock) : "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [clothImages, setClothImages] = useState<string[]>(product?.clothImages ?? []);
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [styleTags, setStyleTags] = useState<string[]>(product?.styleTags ?? []);
  const [styleInput, setStyleInput] = useState("");
  const [suggestedStyles, setSuggestedStyles] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState(product?.customSize ?? "");
  const [bespoke, setBespoke] = useState(product?.bespoke ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [polishing, setPolishing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingCloth, setUploadingCloth] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const clothDragIndex = useRef<number | null>(null);

  // The raw cloth File is kept so we can feed it to Agnes for model generation.
  const [clothFile, setClothFile] = useState<File | null>(null);
  // AI model-image generation flow
  const [genOpen, setGenOpen] = useState(false);
  const [genAnswers, setGenAnswers] = useState<Record<string, GenAnswer>>({});
  const [genCustomOpen, setGenCustomOpen] = useState<Record<string, boolean>>({});
  const [genBrief, setGenBrief] = useState("");
  const [generatingModel, setGeneratingModel] = useState(false);
  const [genPreview, setGenPreview] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const clothFileRef = useRef<HTMLInputElement>(null);

  // Pull the platform's existing aesthetics so vendors can tag from a shared
  // vocabulary; they can still type their own. These are tags only — picking
  // one never creates a new global style entry.
  useEffect(() => {
    let alive = true;
    catalogApi
      .getArtStyles()
      .then((list) => {
        if (alive) setSuggestedStyles(list.map((s) => s.name));
      })
      .catch(() => {
        /* offline / no backend — vendors can still add custom tags */
      });
    return () => {
      alive = false;
    };
  }, []);

  const addStyleTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    setStyleTags((prev) =>
      prev.some((t) => t.toLowerCase() === tag.toLowerCase()) || prev.length >= 12
        ? prev
        : [...prev, tag],
    );
    setStyleInput("");
  };

  const toggleStyleTag = (tag: string) => {
    setStyleTags((prev) =>
      prev.some((t) => t.toLowerCase() === tag.toLowerCase())
        ? prev.filter((t) => t.toLowerCase() !== tag.toLowerCase())
        : prev.length >= 12
          ? prev
          : [...prev, tag],
    );
  };

  // Upload picked files to object storage and store the returned persistent
  // URLs. In demo mode (no vendor token) we fall back to local blob previews.
  const uploadPicked = async (
    picked: File[],
    apply: (urls: string[]) => void,
    setUploading: (v: boolean) => void,
  ) => {
    if (picked.length === 0) return;
    if (!hasAuthToken()) {
      apply(picked.map((f) => URL.createObjectURL(f)));
      return;
    }
    setUploading(true);
    try {
      const urls = await uploadApi.uploadImages(picked);
      apply(urls);
    } catch {
      toast("Image upload failed — using local preview.", "error");
      apply(picked.map((f) => URL.createObjectURL(f)));
    } finally {
      setUploading(false);
    }
  };

  const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const all = Array.from(files);
    const tooBig = all.find((f) => f.type.startsWith("video/") && f.size > MAX_VIDEO_BYTES);
    if (tooBig) {
      toast("Videos must be under 50MB.", "error");
      return;
    }
    const picked = all.slice(0, 8 - images.length);
    void uploadPicked(picked, (urls) => setImages((prev) => [...prev, ...urls]), setUploadingImages);
  };

  const onClothFiles = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).slice(0, 8 - clothImages.length);
    // Remember the first cloth File as the source for AI model generation.
    if (picked[0]) setClothFile(picked[0]);
    void uploadPicked(picked, (urls) => setClothImages((prev) => [...prev, ...urls]), setUploadingCloth);
  };

  const setGenAnswer = (qId: string, label: string, phrase: string) => {
    setGenAnswers((prev) => {
      if (prev[qId]?.label === label && label !== "Custom") {
        const next = { ...prev };
        delete next[qId];
        return next;
      }
      return { ...prev, [qId]: { label, phrase } };
    });
  };

  // Compose the Agnes brief from the product context + style Q&A + free text.
  const composedModelBrief = () => {
    const descriptors = MODEL_QUESTIONS.map((q) => genAnswers[q.id]?.phrase).filter(
      (p): p is string => !!p && p.trim().length > 0,
    );
    const ctx = `${name.trim() || "garment"}${category ? ` (${category})` : ""}`;
    const style = descriptors.length ? ` Show it as ${descriptors.join(", ")}.` : "";
    const extra = genBrief.trim() ? ` ${genBrief.trim()}.` : "";
    return `A ${ctx}.${style}${extra}`.replace(/\.\./g, ".");
  };

  // Resolve a cloth File to send to Agnes — the freshly-picked File if we have
  // it, otherwise fetch the already-uploaded cover cloth image back into a File.
  const resolveClothFile = async (): Promise<File | null> => {
    if (clothFile) return clothFile;
    const url = clothImages[0];
    if (!url) return null;
    try {
      const blob = await (await fetch(url)).blob();
      return new File([blob], "cloth.jpg", { type: blob.type || "image/jpeg" });
    } catch {
      return null;
    }
  };

  const generateModel = async () => {
    const source = await resolveClothFile();
    if (!source) {
      toast("Add a cloth-only photo first.", "info");
      return;
    }
    if (!hasAuthToken()) {
      toast("Log in as a vendor to use AI model generation.", "info");
      return;
    }
    setGeneratingModel(true);
    setGenPreview(null);
    try {
      const { image } = await vendorApi.generateModelImage(source, composedModelBrief());
      setGenPreview(`data:image/png;base64,${image}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast(msg, "error");
    } finally {
      setGeneratingModel(false);
    }
  };

  // Accept the generated model image: upload it (persisted URL) and add to the
  // shopper-facing images as the new cover.
  const acceptGenerated = async () => {
    if (!genPreview) return;
    setUploadingImages(true);
    try {
      const blob = await (await fetch(genPreview)).blob();
      const file = new File([blob], `model-${Date.now()}.png`, { type: "image/png" });
      if (hasAuthToken()) {
        const [url] = await uploadApi.uploadImages([file]);
        setImages((prev) => [url, ...prev]);
      } else {
        setImages((prev) => [genPreview, ...prev]);
      }
      recordUsage("AI Model Image", POLISH_COST);
      toast("Model image added as cover.", "success");
      setGenPreview(null);
      setGenOpen(false);
    } catch {
      toast("Couldn't save the generated image.", "error");
    } finally {
      setUploadingImages(false);
    }
  };

  const toggleSize = (s: string) => {
    setSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const polish = () => {
    setPolishing(true);
    requestSpend(
      POLISH_COST,
      () => {
        setTimeout(() => {
          setPolishing(false);
          recordUsage("AI Image Polish", POLISH_COST);
          toast(`Images polished — ${POLISH_COST} tokens used.`, "success");
        }, 2000);
      },
      "AI Image Polish",
    );
    if (images.length === 0) setPolishing(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Product name is required.";
    if (!description.trim()) e.description = "Description is required.";
    const p = parseFloat(price);
    if (!price || isNaN(p) || p <= 0) e.price = "Enter a valid price.";
    if (p > 99999) e.price = "Max price is GHS 99,999.";
    // Cloth-only image is the source of truth for AI try-on — required to publish.
    if (clothImages.length === 0) e.clothImages = "Upload a cloth-only photo (no model) to publish.";
    // A shopper-facing display image is required too — uploaded or AI-generated.
    if (images.length === 0) e.images = "Add a display image (upload one or generate with AI).";
    if (sizes.length === 0) e.sizes = "Select at least one size.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const persist = (status: Product["status"]) => {
    const base: Omit<Product, "id" | "createdAt"> = {
      name: name.trim(),
      sku: product?.sku ?? `SK-${Math.floor(100 + Math.random() * 900)}`,
      description: description.trim(),
      price: parseFloat(price) || 0,
      category,
      stock: parseInt(stock || "0", 10),
      images,
      clothImages,
      styleTags,
      sizes,
      customSize: sizes.includes("Custom") ? customSize : "",
      bespoke,
      status,
    };
    if (isEdit && product) {
      updateProduct(product.id, base);
    } else {
      addProduct({
        ...base,
        id: `prod-${Date.now()}`,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const saveDraft = () => {
    persist("draft");
    toast("Draft saved.", "success");
    router.push("/vendor/products");
  };

  const publish = () => {
    if (!validate()) {
      toast("Please fix the highlighted fields.", "error");
      return;
    }
    persist("active");
    toast("Product live on storefront!", "success");
    router.push("/vendor/products");
  };

  return (
    <div className="pb-12">
      <PageHeader
        title={isEdit ? `Edit Product` : "New Product"}
        subtitle={isEdit ? product!.name : "Add a new listing to your store"}
        backHref="/vendor/products"
      />

      {/* Mobile: single column | Desktop (lg+): two-column premium layout */}
      <div className="space-y-8 lg:grid lg:grid-cols-[1fr_1fr] lg:gap-12 lg:space-y-0">
        {/* ── Left column: images & media ── */}
        <div className="space-y-8 lg:space-y-10 lg:order-1">
          {/* ── Step 1 · Cloth-only garment (required, powers try-on) ── */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] font-bold text-white dark:bg-white dark:text-ink">1</span>
              <p className="text-v-tsm font-bold text-ink dark:text-white/90">Garment photo — cloth only</p>
              <span className="rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-error">Required</span>
            </div>
            <div
              onClick={() => clothFileRef.current?.click()}
              className="flex h-24 lg:h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line dark:border-white/10 bg-surface-low dark:bg-white/[0.03] text-center transition-colors hover:border-ink/40 dark:hover:border-white/20"
            >
              {uploadingCloth ? (
                <Loader2 className="h-5 w-5 animate-spin text-ink dark:text-white/70" />
              ) : (
                <Shirt className="h-5 w-5 text-ink dark:text-white/70" />
              )}
              <p className="text-v-body font-bold text-ink dark:text-white/90">
                {uploadingCloth ? "Uploading…" : "+ Upload cloth photo"}
              </p>
              <p className="text-v-meta text-mid-grey dark:text-white/50">
                Laid flat or on a hanger — no model. This is what the AI try-on wears.
              </p>
            </div>
            <input
              ref={clothFileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onClothFiles(e.target.files)}
            />
            {errors.clothImages ? (
              <p className="mt-1 text-v-meta text-error">{errors.clothImages}</p>
            ) : null}
            {clothImages.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {clothImages.map((img, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => (clothDragIndex.current = i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (clothDragIndex.current === null) return;
                      const next = [...clothImages];
                      const [m] = next.splice(clothDragIndex.current, 1);
                      next.splice(i, 0, m);
                      setClothImages(next);
                      clothDragIndex.current = null;
                    }}
                    className="relative h-16 w-16 lg:h-20 lg:w-20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt=""
                      className="h-16 w-16 lg:h-20 lg:w-20 rounded-lg object-cover ring-1 ring-line dark:ring-white/10"
                    />
                    {i === 0 ? (
                      <span className="absolute -top-1.5 left-0 rounded-full bg-teal px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                        Try-on
                      </span>
                    ) : null}
                    <GripVertical className="absolute bottom-0.5 right-0.5 h-3 w-3 text-white/70 drop-shadow" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* ── Step 2 · Shopper-facing display image (upload or AI-generate) ── */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] font-bold text-white dark:bg-white dark:text-ink">2</span>
              <p className="text-v-tsm font-bold text-ink dark:text-white/90">Display image — model wearing it</p>
            </div>
            <p className="mb-2 text-v-meta text-mid-grey dark:text-white/50">
              Shown to shoppers. Upload a photo or short video (MP4/WebM, under 50MB), or generate one from your cloth photo.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-line dark:border-white/10 bg-white dark:bg-surface-dark py-2.5 text-v-body font-bold text-ink dark:text-white/90 hover:bg-surface-low dark:hover:bg-white/5 transition-colors"
              >
                {uploadingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload
              </button>
              <button
                onClick={() => {
                  if (clothImages.length === 0) {
                    toast("Add a cloth photo first.", "info");
                    return;
                  }
                  setGenOpen((o) => !o);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-v-body font-bold transition-colors",
                  genOpen
                    ? "bg-teal text-white"
                    : "border border-teal/50 bg-teal/10 text-teal dark:text-off-white hover:bg-teal/20",
                )}
              >
                <Wand2 className="h-4 w-4" /> Generate with AI
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/mp4,video/webm"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />

            {/* AI generation panel */}
            {genOpen ? (
              <div className="mt-3 rounded-xl border border-teal/40 bg-teal/[0.04] dark:bg-white/[0.03] p-3 space-y-3">
                {MODEL_QUESTIONS.map((q) => {
                  const current = genAnswers[q.id];
                  const isCustom = genCustomOpen[q.id];
                  return (
                    <div key={q.id}>
                      <p className="mb-1.5 text-v-meta font-bold text-ink dark:text-white/90">{q.question}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {q.options.map((o) => {
                          const active = current?.label === o.label;
                          return (
                            <button
                              key={o.label}
                              onClick={() => {
                                setGenAnswer(q.id, o.label, o.phrase);
                                setGenCustomOpen((c) => ({ ...c, [q.id]: false }));
                              }}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-v-meta transition-colors",
                                active
                                  ? "border-teal bg-teal/10 font-bold text-teal dark:text-off-white"
                                  : "border-line dark:border-white/15 text-ink dark:text-white/80 hover:bg-surface-low dark:hover:bg-white/5",
                              )}
                            >
                              {o.label}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => {
                            setGenCustomOpen((c) => ({ ...c, [q.id]: !c[q.id] }));
                            if (current?.label !== "Custom") setGenAnswer(q.id, "Custom", "");
                          }}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-v-meta transition-colors",
                            current?.label === "Custom"
                              ? "border-teal bg-teal/10 font-bold text-teal dark:text-off-white"
                              : "border-dashed border-line dark:border-white/15 text-mid-grey hover:bg-surface-low dark:hover:bg-white/5",
                          )}
                        >
                          Custom
                        </button>
                      </div>
                      {isCustom ? (
                        <input
                          autoFocus
                          value={current?.label === "Custom" ? current.phrase : ""}
                          onChange={(e) => setGenAnswer(q.id, "Custom", e.target.value)}
                          placeholder="Describe it…"
                          className="vendor-input mt-1.5 text-v-meta"
                        />
                      ) : null}
                    </div>
                  );
                })}

                <textarea
                  value={genBrief}
                  onChange={(e) => setGenBrief(e.target.value.slice(0, 300))}
                  placeholder="Any extra direction for the AI (optional)…"
                  className="vendor-input h-14 resize-none text-v-meta"
                />

                {genPreview ? (
                  <div>
                    <div className="overflow-hidden rounded-xl ring-1 ring-line dark:ring-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={genPreview} alt="Generated model" className="max-h-72 w-full object-contain bg-surface-low dark:bg-white/5" />
                    </div>
                    <p className="mt-1 text-center text-v-meta text-mid-grey dark:text-white/50">Confirm or reject this result.</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={acceptGenerated}
                        disabled={uploadingImages}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-ink dark:bg-white dark:text-ink px-3 py-2 text-v-body font-bold text-white disabled:opacity-40"
                      >
                        <Check className="h-4 w-4" /> Use this
                      </button>
                      <button
                        onClick={generateModel}
                        disabled={generatingModel}
                        className="flex items-center justify-center gap-1 rounded-lg border border-line dark:border-white/10 px-3 py-2 text-v-body font-bold text-ink dark:text-white/90 disabled:opacity-40"
                      >
                        <RefreshCw className={cn("h-4 w-4", generatingModel && "animate-spin")} /> Redo
                      </button>
                      <button
                        onClick={() => setGenPreview(null)}
                        className="flex items-center justify-center gap-1 rounded-lg border border-line dark:border-white/10 px-3 py-2 text-v-body font-bold text-error"
                      >
                        <X className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={generateModel}
                    disabled={generatingModel}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal py-2.5 text-v-tsm font-bold text-white disabled:opacity-50"
                  >
                    {generatingModel ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Generate model image
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : null}

            {errors.images ? (
              <p className="mt-1 text-v-meta text-error">{errors.images}</p>
            ) : null}
            {images.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => (dragIndex.current = i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex.current === null) return;
                      const next = [...images];
                      const [m] = next.splice(dragIndex.current, 1);
                      next.splice(i, 0, m);
                      setImages(next);
                      dragIndex.current = null;
                    }}
                    className="relative h-16 w-16 lg:h-20 lg:w-20"
                  >
                    {/\.(mp4|webm)(\?|$)/i.test(img) ? (
                      <video
                        src={img}
                        muted
                        playsInline
                        className="h-16 w-16 lg:h-20 lg:w-20 rounded-lg object-cover ring-1 ring-line dark:ring-white/10"
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={img}
                        alt=""
                        className="h-16 w-16 lg:h-20 lg:w-20 rounded-lg object-cover ring-1 ring-line dark:ring-white/10"
                      />
                    )}
                    {i === 0 ? (
                      <span className="absolute -top-1.5 left-0 rounded-full bg-ink px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                        Cover
                      </span>
                    ) : null}
                    <GripVertical className="absolute bottom-0.5 right-0.5 h-3 w-3 text-white/70 drop-shadow" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* AI Polish */}
          <div className="flex items-center gap-3">
            <p className="text-[11px] lg:text-v-body text-mid-grey dark:text-white/50">
              AI Image Polish — cleans photos. Costs {POLISH_COST} tokens.
            </p>
            <button
              onClick={polish}
              disabled={polishing || images.length === 0}
              className="flex items-center gap-1.5 rounded-full bg-teal px-3 py-1.5 text-[11px] lg:text-v-body font-bold text-white disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
            >
              {polishing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Polish All
            </button>
          </div>

          {/* Style tags — desktop: in left column beneath images */}
          <div className="lg:block">
            <p className="text-v-body text-ink dark:text-white/90">Style Tags</p>
            <p className="text-v-meta text-mid-grey dark:text-white/50">
              Pick the aesthetics that fit this piece, or add your own. Shoppers use these to discover your product.
            </p>

            {styleTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {styleTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-ink bg-ink/5 px-3 py-1 text-v-body font-bold text-ink dark:border-white/30 dark:text-white"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => toggleStyleTag(tag)}
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-2 flex gap-2">
              <input
                value={styleInput}
                onChange={(e) => setStyleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addStyleTag(styleInput);
                  }
                }}
                placeholder="e.g. Afro-Surreal, Streetwear…"
                maxLength={60}
                className="vendor-input flex-1"
              />
              <button
                type="button"
                onClick={() => addStyleTag(styleInput)}
                disabled={!styleInput.trim() || styleTags.length >= 12}
                className="flex items-center gap-1 rounded-md border border-line dark:border-white/10 bg-white dark:bg-surface-dark px-3 text-v-body font-bold text-ink dark:text-white/90 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>

            {suggestedStyles.filter((s) => !styleTags.some((t) => t.toLowerCase() === s.toLowerCase())).length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedStyles
                  .filter((s) => !styleTags.some((t) => t.toLowerCase() === s.toLowerCase()))
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleStyleTag(s)}
                      disabled={styleTags.length >= 12}
                      className="rounded-full border border-dashed border-line dark:border-white/15 px-3 py-1 text-v-body text-mid-grey dark:text-white/60 hover:border-ink hover:text-ink dark:hover:text-white disabled:opacity-40"
                    >
                      + {s}
                    </button>
                  ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Right column: form fields ── */}
        <div className="space-y-8 lg:space-y-10 lg:order-2">
          <Field label="Product Name" error={errors.name}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="vendor-input"
            />
          </Field>
          <Field label="Product Description" error={errors.description}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="vendor-input h-[88px] resize-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <Field label="Price (GHS)" error={errors.price}>
              <input
                value={price}
                inputMode="decimal"
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^\d*\.?\d*$/.test(v)) setPrice(v);
                }}
                className="vendor-input"
              />
            </Field>
            <Field label="Stock Quantity">
              <input
                value={stock}
                inputMode="numeric"
                onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
                className="vendor-input"
              />
            </Field>
          </div>
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="vendor-input"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>

          <div>
            <p className="text-v-body text-ink dark:text-white/90">Available Sizes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSize(s)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-v-body",
                      sizes.includes(s)
                      ? "border-ink bg-ink/5 font-bold text-ink dark:border-white/30 dark:text-white"
                      : "border-line bg-white dark:bg-surface-dark dark:border-white/10 text-ink dark:text-white/60",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {errors.sizes ? (
              <p className="mt-1 text-v-meta text-error">{errors.sizes}</p>
            ) : null}
            {sizes.includes("Custom") ? (
              <input
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="Describe custom sizing (e.g. Free Size, One Size, Bespoke)"
                className="vendor-input mt-2"
              />
            ) : null}
          </div>

          <button
            onClick={() => setBespoke((b) => !b)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border px-4 py-3.5 transition-colors",
              bespoke ? "border-ink/30 bg-ink/[0.03] dark:bg-white/[0.03]" : "border-line dark:border-white/10 bg-white dark:bg-surface-dark",
            )}
          >
            <div className="text-left">
              <p className="text-v-body font-bold text-ink dark:text-white/90">
                This item is made-to-measure (tailor orders)
              </p>
              {bespoke ? (
                <p className="text-v-meta text-mid-grey dark:text-white/50">
                  Buyers will be prompted to submit measurements at checkout.
                </p>
              ) : null}
            </div>
            <span
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors shrink-0 ml-4",
                bespoke ? "bg-ink dark:bg-white" : "bg-line",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                  bespoke ? "left-[18px]" : "left-0.5",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Action buttons — full width below both columns */}
      <div className="mt-6 lg:mt-8 flex gap-3">
        <button
          onClick={saveDraft}
          className="flex-1 rounded-full border border-line dark:border-white/10 bg-white dark:bg-surface-dark py-3 lg:h-btn-d text-v-tsm font-bold text-ink dark:text-white/90 hover:bg-surface-low dark:hover:bg-white/5 transition-colors"
        >
          Save as Draft
        </button>
        <button
          onClick={publish}
          className="flex-1 rounded-full bg-ink dark:bg-white dark:text-ink py-3 lg:h-btn-d text-v-tsm font-bold text-white hover:opacity-90 transition-opacity"
        >
          Publish Live
        </button>
      </div>

      {isEdit && product ? (
        <div className="mt-4 flex items-center justify-center gap-6">
          <button
            onClick={() => setConfirmArchive(true)}
            className="text-v-body font-bold text-ink/60 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors"
          >
            Archive Product
          </button>
          <span className="text-line dark:text-white/10">|</span>
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={product.status === "sold_out"}
            className="text-v-body font-bold text-error/60 hover:text-error disabled:opacity-40 transition-colors"
            title={product.status === "sold_out" ? "" : "Orders exist for this product."}
          >
            Delete Product
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={`Archive ${product?.name}?`}
        description="It will be hidden from the storefront but not deleted."
        confirmLabel="Archive"
        onConfirm={() => {
          archiveProduct(product!.id);
          toast("Product archived.", "success");
          router.push("/vendor/products");
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${product?.name}?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          deleteProduct(product!.id);
          toast("Product deleted.", "success");
          router.push("/vendor/products");
        }}
      />
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-v-body text-ink dark:text-white/90">{label}</label>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-v-meta text-error">{error}</p> : null}
    </div>
  );
}
