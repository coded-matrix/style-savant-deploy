"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  Loader2,
  Download,
  Copy,
  Sparkles,
  Check,
  ImageIcon,
  Wand2,
  Plus,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVendor } from "@/context/VendorContext";
import { Thumb } from "@/components/vendor/shared";
import { vendorApi, hasAuthToken } from "@/lib/api/vendor";
import { CAMPAIGN_COST } from "@/lib/vendor/constants";
import type { CampaignFormat, CampaignMarket, Campaign } from "@/lib/vendor/types";

const MARKETS: CampaignMarket[] = ["Domestic", "Diaspora", "International"];
const FORMATS: CampaignFormat[] = ["Instagram Post", "Story", "Carousel"];

const AUDIENCE_FOR: Record<CampaignMarket, string> = {
  Domestic: "domestic",
  Diaspora: "diaspora",
  International: "international",
};

/**
 * Style-discovery questions. Each answer contributes a descriptor phrase to the
 * final Agnes prompt. Vendors can pick an option, write their own, or skip.
 */
interface StyleQuestion {
  id: string;
  question: string;
  options: { label: string; phrase: string }[];
}

const STYLE_QUESTIONS: StyleQuestion[] = [
  {
    id: "presentation",
    question: "How should the product be presented?",
    options: [
      { label: "Product only", phrase: "product-only fashion still life; no person, body, hands or invented outfit" },
      { label: "Ghost mannequin", phrase: "precise ghost-mannequin presentation preserving the exact garment construction" },
      { label: "Model editorial", phrase: "one fashion model wearing only the exact reference garment, with no added accessories" },
      { label: "Detail-led", phrase: "detail-led fashion composition emphasizing the real fabric, finish and construction" },
    ],
  },
  {
    id: "treatment",
    question: "Choose a fashion campaign treatment",
    options: [
      { label: "Luxury still life", phrase: "luxury fashion still life with sculptural product placement and controlled shadows" },
      { label: "Lookbook", phrase: "clean contemporary lookbook art direction with precise styling and restrained layout" },
      { label: "Magazine editorial", phrase: "fashion magazine product editorial with assertive cropping and intentional negative space" },
      { label: "Street campaign", phrase: "modern street-fashion campaign energy with architectural scale and graphic framing" },
    ],
  },
  {
    id: "mood",
    question: "What mood should it feel like?",
    options: [
      { label: "Elegant & minimal", phrase: "an elegant, minimalist mood with quiet luxury" },
      { label: "Bold & vibrant", phrase: "a bold, vibrant and energetic mood" },
      { label: "Heritage & regal", phrase: "a regal heritage mood rooted in tradition" },
      { label: "Street & modern", phrase: "a modern streetwear mood with urban edge" },
    ],
  },
  {
    id: "setting",
    question: "Where is the scene set?",
    options: [
      { label: "Colour-block studio", phrase: "set in a bold colour-block fashion studio with geometric planes" },
      { label: "Gallery plinth", phrase: "displayed as a design object on a sculptural gallery plinth" },
      { label: "Architecture", phrase: "framed by contemporary West African architecture and directional daylight" },
      { label: "Textile workshop", phrase: "set in an authentic textile atelier with restrained material context" },
    ],
  },
  {
    id: "lighting",
    question: "Choose the lighting language",
    options: [
      { label: "Hard flash", phrase: "direct hard-flash fashion lighting with crisp editorial shadows" },
      { label: "Window light", phrase: "soft directional window light revealing true fabric texture" },
      { label: "Sculpted studio", phrase: "sculpted studio lighting with a precise rim light and deep controlled shadow" },
      { label: "Golden hour", phrase: "low golden-hour light with long graphic shadows and accurate product colour" },
    ],
  },
  {
    id: "palette",
    question: "Which colour direction?",
    options: [
      { label: "Warm earth tones", phrase: "a warm earth-tone palette of stone, clay and cream" },
      { label: "Bright & colourful", phrase: "a bright, saturated and colourful palette" },
      { label: "Monochrome", phrase: "a restrained monochrome, neutral palette" },
      { label: "Jewel tones", phrase: "a rich jewel-tone palette" },
    ],
  },
  {
    id: "occasion",
    question: "What is it styled for?",
    options: [
      { label: "Everyday wear", phrase: "styled for confident everyday wear" },
      { label: "Festival", phrase: "styled for a festival or celebration" },
      { label: "Wedding / formal", phrase: "styled for a wedding or formal occasion" },
      { label: "Seasonal drop", phrase: "styled as a fresh seasonal collection drop" },
    ],
  },
];

const COMPOSITION_VARIANTS = [
  "asymmetrical campaign layout, product off-centre with generous copy space",
  "strong centred hero composition with a low camera position and clean horizon",
  "overhead fashion still life with disciplined geometry and sharp material shadows",
  "close editorial crop balanced by one wide area of negative space",
  "architectural composition using one bold diagonal and strong scale contrast",
  "gallery-display composition treating the product as a collectible design object",
  "high-energy hard-flash composition with a slight camera tilt but no product distortion",
  "quiet tonal composition using layered depth and a narrow directional beam of light",
];

interface Answer {
  label: string; // chosen option label, or "Custom"
  phrase: string; // descriptor injected into the prompt
}

export default function CampaignNewPage() {
  const { products, requestSpend, addCampaign, recordUsage, toast } = useVendor();
  const router = useRouter();

  // ── inputs ──
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selected, setSelected] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [customOpen, setCustomOpen] = useState<Record<string, boolean>>({});
  const [headline, setHeadline] = useState("");
  const [prompt, setPrompt] = useState("");
  const [market, setMarket] = useState<CampaignMarket>("Domestic");
  const [format, setFormat] = useState<CampaignFormat>("Instagram Post");

  // ── generation ──
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState(0);
  const [result, setResult] = useState<Campaign | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandImage, setExpandImage] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const lastCompositionRef = useRef(-1);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Prefill from sessionStorage if coming from Edit / Reuse
  useEffect(() => {
    const raw = sessionStorage.getItem("vendor-campaign-reuse");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.products) setSelected(data.products);
      if (data.prompt) setPrompt(data.prompt);
      if (data.market) setMarket(data.market);
      if (data.format) setFormat(data.format);
    } catch { /* ignore */ }
    sessionStorage.removeItem("vendor-campaign-reuse");
  }, []);

  const selectedProducts = products.filter((p) => selected.includes(p.id));
  const available = products.filter((p) => !selected.includes(p.id));

  const onFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast("Image too large. Please use one under 10MB.", "error");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const setAnswer = (qId: string, label: string, phrase: string) => {
    setAnswers((prev) => {
      // Tapping the active option again clears it (acts as skip).
      if (prev[qId]?.label === label && label !== "Custom") {
        const next = { ...prev };
        delete next[qId];
        return next;
      }
      return { ...prev, [qId]: { label, phrase } };
    });
  };

  const answeredCount = Object.keys(answers).length;

  // The composed Agnes prompt: the vendor's brief + every style descriptor.
  const composedPrompt = useMemo(() => {
    const descriptors = STYLE_QUESTIONS.map((q) => answers[q.id]?.phrase).filter(
      (p): p is string => !!p && p.trim().length > 0,
    );
    const brief = prompt.trim();
    const headlineText = headline.trim();
    const lead = headlineText || brief || `A campaign for ${selectedProducts[0]?.name ?? "this piece"}`;
    const rest = headlineText && brief ? `. ${brief}` : "";
    const style = descriptors.length ? ` Style direction: ${descriptors.join("; ")}.` : "";
    const fmt = ` Optimised for a ${format}.`;
    return `${lead}${rest}.${style}${fmt}`.replace(/\.\./g, ".");
  }, [prompt, headline, answers, selectedProducts, format]);

  const canGenerate = !!imageFile && (prompt.trim().length > 0 || headline.trim().length > 0 || answeredCount > 0) && !generating;

  const phases = ["Reading your product…", "Writing the copy…", "Creating and publishing the graphic…"];

  const runGeneration = async () => {
    setGenerating(true);
    setResult(null);
    setPhase(0);
    const timer = setInterval(() => setPhase((p) => Math.min(p + 1, phases.length - 1)), 1200);
    const audience = AUDIENCE_FOR[market];
    let compositionIndex = Math.floor(Math.random() * COMPOSITION_VARIANTS.length);
    if (compositionIndex === lastCompositionRef.current) {
      compositionIndex = (compositionIndex + 1) % COMPOSITION_VARIANTS.length;
    }
    lastCompositionRef.current = compositionIndex;
    const generationPrompt =
      `${composedPrompt} Composition variant: ${COMPOSITION_VARIANTS[compositionIndex]}.`;

    // Local copy composer — used in demo mode and as a fallback if the backend
    // rejects (e.g. no active subscription) so the vendor always gets a result.
    const mockCopy = () => {
      const names = selectedProducts.map((p) => p.name).join(", ") || "our latest piece";
      return {
        caption: `${prompt.trim() || `Discover ${names}`} — crafted in Ghana with heritage fabric and modern lines.`,
        hashtags: ["#StyleSavant", "#MadeInGhana", "#Ankara", "#OOTD", market === "Diaspora" ? "#Diaspora" : "#Accra"],
        ad_text: "Wear your heritage, boldly.",
      };
    };

    try {
      let caption: string;
      let hashtags: string[];
      let adText: string | undefined;
      let image = imagePreview; // fall back to the uploaded image
      let externalId: string | undefined;
      let shareUrl: string | undefined;
      const campaignTitle = `${selectedProducts[0]?.name ?? "New"} — ${market} Campaign`;

      if (hasAuthToken() && imageFile) {
        // Copy is composed locally so campaign creation does not depend on a
        // second AI provider. Agnes creates the new graphic, which is then
        // published to the shared Coded Matrix campaign API.
        const copy = mockCopy();
        caption = copy.caption;
        hashtags = copy.hashtags;
        adText = copy.ad_text;
        const img = await vendorApi.generateCampaignImage(
          imageFile,
          generationPrompt,
          audience,
          headline.trim() || undefined,
          format,
        );
        const generatedImage = `data:image/png;base64,${img.image}`;
        const published = await vendorApi.publishCampaign({
          title: campaignTitle,
          copyText: `${caption}\n\n${hashtags.join(" ")}`,
          imageBase64: generatedImage,
          featuredItems: selectedProducts.map((product) => ({
            id: product.id,
            name: product.name,
          })),
        });
        image = published.imageUrl;
        externalId = published.id;
        shareUrl = published.shareUrl;
      } else {
        // Demo fallback (no vendor token): compose copy locally.
        await new Promise((r) => setTimeout(r, 1600));
        const copy = mockCopy();
        caption = copy.caption;
        hashtags = copy.hashtags;
        adText = copy.ad_text;
      }

      const campaign: Campaign = {
        id: externalId ?? `cmp-${Date.now()}`,
        title: campaignTitle,
        caption,
        hashtags,
        adText,
        image,
        products: selected,
        prompt: generationPrompt,
        market,
        format,
        tokens: CAMPAIGN_COST,
        date: new Date().toISOString(),
        shareUrl,
      };
      addCampaign(campaign);
      recordUsage("Campaign Creation", CAMPAIGN_COST);
      setResult(campaign);
      toast(shareUrl ? "Campaign graphic created and published!" : "Campaign generated!", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      toast(message, "error");
    } finally {
      clearInterval(timer);
      setGenerating(false);
    }
  };

  const generate = () => {
    if (!canGenerate) return;
    // Gate on tokens (shows the paywall if short), then run.
    requestSpend(CAMPAIGN_COST, () => void runGeneration(), "Campaign Creation");
  };

  const copyCaption = () => {
    if (!result) return;
    navigator.clipboard?.writeText(
      `${result.caption}\n\n${result.hashtags.join(" ")}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-v-body font-bold text-teal dark:text-off-white"
      >
        <span className="text-lg leading-none">←</span> Back
      </button>

      <h1 className="text-v-title font-bold text-ink dark:text-white/90 mb-1">Campaign Creator</h1>
      <p className="text-v-meta text-vendor-text-grey mb-6">Graphic powered by Agnes · Published through Coded Matrix · Costs tokens per generation</p>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr] lg:gap-6">
        {/* ── Left: the builder ── */}
        <div className="space-y-4">

          {/* Step 1 — Product image */}
          <Card step={1} title="Product image" hint="Agnes builds the campaign around this photo.">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files)}
            />
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-xl border border-line dark:border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Product" className="h-44 w-full object-cover" />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-v-meta font-bold text-ink"
                >
                  <ImageIcon className="h-3 w-3" /> Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line dark:border-white/15 bg-surface-low dark:bg-white/[0.03] text-mid-grey hover:border-teal dark:hover:border-white/30 transition-colors"
              >
                <Upload className="h-6 w-6" />
                <span className="text-v-body font-bold text-ink dark:text-white/90">Upload product photo</span>
                <span className="text-v-meta">PNG or JPG · up to 10MB</span>
              </button>
            )}

            {/* Optional product tags for the saved record */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-v-meta text-vendor-text-grey">Tag products (optional):</span>
              {selectedProducts.map((p) => (
                <span
                  key={p.id}
                  className="flex items-center gap-1 rounded-full border border-teal bg-teal/10 py-0.5 pl-0.5 pr-2"
                >
                  <Thumb name={p.name} className="h-4 w-4 rounded-full" />
                  <span className="text-v-meta text-ink dark:text-white/90">{p.name}</span>
                  <button onClick={() => setSelected((s) => s.filter((x) => x !== p.id))}>
                    <X className="h-3 w-3 text-mid-grey" />
                  </button>
                </span>
              ))}
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setPickerOpen((o) => !o)}
                  className="flex items-center gap-1 rounded-full border border-dashed border-line dark:border-white/15 px-2.5 py-1 text-v-meta text-ink dark:text-white/90"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
                {pickerOpen && (
                  <div className="absolute left-0 top-8 z-20 max-h-56 w-52 overflow-y-auto rounded-lg border border-line bg-white shadow-lg dark:border-white/10 dark:bg-surface-dark">
                    {available.length === 0 ? (
                      <p className="p-3 text-v-meta text-vendor-text-grey">No more products.</p>
                    ) : (
                      available.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelected((s) => [...s, p.id]);
                            setPickerOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-v-body hover:bg-surface-low dark:hover:bg-white/5"
                        >
                          <Thumb name={p.name} className="h-6 w-6" /> {p.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Step 2 — Style Q&A */}
          <Card
            step={2}
            title="Style Q&A"
            hint="Quick taps sharpen the AI prompt. Skip any — or write your own."
            badge={answeredCount > 0 ? `${answeredCount}/${STYLE_QUESTIONS.length}` : undefined}
          >
            <div className="space-y-4">
              {STYLE_QUESTIONS.map((q) => {
                const current = answers[q.id];
                const isCustom = customOpen[q.id];
                return (
                  <div key={q.id}>
                    <p className="mb-1.5 text-v-body font-bold text-ink dark:text-white/90">{q.question}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {q.options.map((o) => {
                        const active = current?.label === o.label;
                        return (
                          <button
                            key={o.label}
                            onClick={() => {
                              setAnswer(q.id, o.label, o.phrase);
                              setCustomOpen((c) => ({ ...c, [q.id]: false }));
                            }}
                            className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                              active
                                ? "border-teal bg-teal/10 font-bold text-teal dark:border-off-white dark:bg-off-white/10 dark:text-off-white"
                                : "border-line dark:border-white/20 text-ink dark:text-white/70 hover:bg-surface-low dark:hover:bg-white/[0.06]",
                            )}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => {
                          setCustomOpen((c) => ({ ...c, [q.id]: !c[q.id] }));
                          if (current?.label !== "Custom") setAnswer(q.id, "Custom", "");
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-v-meta transition-colors",
                          current?.label === "Custom"
                            ? "border-teal bg-teal/10 font-bold text-teal dark:border-off-white dark:bg-off-white/10 dark:text-off-white"
                            : "border-dashed border-line dark:border-white/20 text-mid-grey hover:bg-surface-low dark:hover:bg-white/[0.06]",
                        )}
                      >
                        Custom
                      </button>
                    </div>
                    {isCustom && (
                      <input
                        autoFocus
                        value={current?.label === "Custom" ? current.phrase : ""}
                        onChange={(e) => setAnswer(q.id, "Custom", e.target.value)}
                        placeholder="Describe it in your own words…"
                        className="vendor-input mt-2 text-v-meta"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Step 3 — Headline + brief + targeting */}
          <Card step={3} title="Your campaign" hint="Add a headline for the image, then fine-tune the copy.">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-v-body font-bold text-ink dark:text-white/90">
                  Headline <span className="font-normal text-vendor-text-grey">(appears on image)</span>
                </label>
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value.slice(0, 60))}
                  placeholder="e.g. New Drop — Eid Collection"
                  className="vendor-input"
                />
                <p className="mt-1 text-right text-v-meta text-vendor-text-grey">{headline.length}/60</p>
              </div>
              <div>
                <label className="mb-1 block text-v-body font-bold text-ink dark:text-white/90">
                  Brief <span className="font-normal text-vendor-text-grey">(optional extra detail)</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
                  placeholder="e.g. Celebrate Eid with vibrant Ankara. Target young women in Accra."
                  className="vendor-input h-[72px] resize-none"
                />
                <p className="mt-1 text-right text-v-meta text-vendor-text-grey">{prompt.length}/500</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-vendor-text-grey">Target market</p>
                <div className="flex flex-wrap gap-1">
                  {MARKETS.map((m) => (
                    <Segmented key={m} active={market === m} onClick={() => setMarket(m)}>
                      {m}
                    </Segmented>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-vendor-text-grey">Format</p>
                <div className="flex flex-wrap gap-1">
                  {FORMATS.map((f) => (
                    <Segmented key={f} active={format === f} onClick={() => setFormat(f)}>
                      {f}
                    </Segmented>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right: prompt preview, generate, result ── */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {/* Live prompt preview */}
          <div className="rounded-xl border border-line dark:border-white/10 bg-white dark:bg-surface-dark p-4">
            <div className="mb-2 flex items-center gap-1.5 text-v-meta font-bold uppercase tracking-wide text-teal dark:text-off-white">
              <Wand2 className="h-3.5 w-3.5" /> AI prompt preview
            </div>
            <p className="text-v-body leading-relaxed text-ink/80 dark:text-white/70">{composedPrompt}</p>
          </div>

          <button
            disabled={!canGenerate}
            onClick={generate}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white dark:bg-off-white py-3.5 text-v-tsm font-bold text-ink shadow-sm disabled:opacity-40 disabled:shadow-none transition-opacity"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {phases[phase]}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate Campaign (est. {CAMPAIGN_COST} tk)
              </>
            )}
          </button>
          {!imageFile && (
            <p className="text-center text-v-meta text-vendor-text-grey">Upload a product photo to begin.</p>
          )}

          {result && (
            <div className="overflow-hidden rounded-xl border border-line dark:border-white/10 bg-white dark:bg-surface-dark">
              {result.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.image}
                  alt={result.title}
                  className="h-56 w-full object-cover cursor-pointer"
                  onClick={() => setExpandImage(result.image!)}
                />
              ) : (
                <div className="grid h-40 w-full place-items-center bg-gradient-to-br from-teal to-vendor-container text-white">
                  <Sparkles className="h-7 w-7" />
                </div>
              )}
              <div className="p-4">
                <p className="text-v-tsm font-bold text-ink dark:text-white/90">{result.title}</p>
                {result.adText && (
                  <p className="mt-0.5 text-v-body italic text-teal dark:text-off-white">“{result.adText}”</p>
                )}
                <p className="mt-2 text-v-body text-vendor-text-grey">{result.caption}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {result.hashtags.map((h) => (
                    <span key={h} className="text-v-meta text-teal dark:text-off-white">
                      {h}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={result.image || undefined}
                    download={`campaign-${result.id}.png`}
                    onClick={(e) => {
                      if (!result.image) {
                        e.preventDefault();
                        toast("No image to download.", "info");
                      }
                    }}
                    className="flex items-center gap-1 rounded-full bg-teal px-3 py-1.5 text-v-body font-bold text-white"
                  >
                    <Download className="h-4 w-4" /> Image
                  </a>
                  <button
                    onClick={copyCaption}
                    className="flex items-center gap-1 rounded-full bg-teal px-3 py-1.5 text-v-body font-bold text-white"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy caption"}
                  </button>
                  {result.shareUrl && (
                    <a
                      href={result.shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-full bg-teal px-3 py-1.5 text-v-body font-bold text-white"
                    >
                      <ExternalLink className="h-4 w-4" /> View campaign
                    </a>
                  )}
                  <button
                    onClick={generate}
                    disabled={generating}
                    className="rounded-full border border-line dark:border-white/10 px-3 py-1.5 text-v-body font-bold text-ink dark:text-white/90 disabled:opacity-40"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {expandImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpandImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expandImage}
            alt="Expanded campaign"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}

function Card({
  step,
  title,
  hint,
  badge,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line dark:border-white/10 bg-white dark:bg-surface-dark p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-white dark:bg-white dark:text-ink">
          {step}
        </span>
        <div className="flex-1">
          <p className="text-v-tsm font-bold text-ink dark:text-white/90">{title}</p>
          {hint && <p className="text-v-meta text-vendor-text-grey">{hint}</p>}
        </div>
        {badge && (
          <span className="rounded-full bg-teal/10 px-2 py-0.5 text-v-meta font-bold text-teal dark:text-off-white">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Segmented({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-v-meta transition-colors",
        active
          ? "border-teal bg-teal/10 font-bold text-teal dark:border-off-white dark:bg-off-white/10 dark:text-off-white"
          : "border-line dark:border-white/20 text-ink dark:text-white/70 hover:bg-surface-low dark:hover:bg-white/[0.06]",
      )}
    >
      {children}
    </button>
  );
}
