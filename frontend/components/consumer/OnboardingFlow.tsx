"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/consumer/store";
import { SmartImage } from "./SmartImage";

interface OnboardingFlowProps {
  onComplete: () => void;
}

type Step = 1 | 2;

interface OnboardingData {
  username: string;
  artStyleIds: string[];
  backdropId: string;
  fitProfile: { photo?: string; modelId?: string };
}

const MAX_ART_STYLES = 3;

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { setUser, setOnboarding, markReturning } = useApp();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<OnboardingData>({
    artStyleIds: [],
    username: "",
    backdropId: "b1",
    fitProfile: {},
  });

  const next = () => setStep((s) => Math.min(2, s + 1) as Step);

  const complete = (finalData: OnboardingData) => {
    setUser({
      username: finalData.username || `Guest_${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      isGuest: !finalData.username,
      artStyleIds: finalData.artStyleIds,
      fitProfile: finalData.fitProfile,
    });
    setOnboarding({
      username: finalData.username,
      artStyleIds: finalData.artStyleIds,
      backdropId: finalData.backdropId,
    });
    markReturning();
    onComplete();
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-onboard-dark overflow-x-hidden">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ArtStyleStep
              value={data.artStyleIds}
              onChange={(v) => setData((d) => ({ ...d, artStyleIds: v }))}
              onNext={next}
              onSkip={next}
            />
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FitProfileStep
              value={data.fitProfile}
              onChange={(v) => setData((d) => ({ ...d, fitProfile: v }))}
              onBack={() => setStep(1)}
              onComplete={(fp) => complete({ ...data, fitProfile: fp })}
              onSkip={() => complete({ ...data, fitProfile: {} })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ── S-03 · Art Style Selection ──
function ArtStyleStep({
  value,
  onChange,
  onNext,
  onSkip,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const { artStyles } = useApp();
  const reachedMax = value.length >= MAX_ART_STYLES;

  const toggle = (id: string) => {
    onChange(
      value.includes(id)
        ? value.filter((x) => x !== id)
        : reachedMax
        ? value
        : [...value, id]
    );
  };

  return (
    <>
      {/* ── Header ── */}
      <header className="relative flex shrink-0 items-center justify-between bg-white dark:bg-onboard-dark px-6 py-5 z-10">
        <div className="w-10" />

        {/* Step indicator — centered */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <span className="h-[3px] w-8 rounded-full bg-coral" />
          <span className="h-[3px] w-3 rounded-full bg-black/10 dark:bg-white/15" />
        </div>

        <button
          onClick={onSkip}
          className="text-[11px] font-bold uppercase tracking-[0.12em] text-mid-grey transition-all hover:text-ink dark:hover:text-white/80"
        >
          Skip
        </button>
      </header>

      {/* ── Scrollable content ── */}
      <main className="no-scrollbar flex-grow min-h-0 overflow-y-auto pt-8 pb-24">
        <div className="mx-auto max-w-4xl px-6 md:px-10 lg:px-16">
          {/* Hero copy */}
          <div className="mb-8">
            <h1 className="mb-2 font-serif text-[32px] font-normal italic leading-[1.1] tracking-tight text-ink dark:text-white md:text-[38px]">
              Choose your style
            </h1>
            <p className="text-[14px] leading-relaxed text-mid-grey dark:text-zinc-400">
              Select up to {MAX_ART_STYLES} aesthetics
              {value.length > 0 && (
                <span className="ml-1.5 text-ink dark:text-white font-semibold">
                  · {value.length} selected
                </span>
              )}
            </p>
          </div>

          {/* Art style grid — 2 cols on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {artStyles.map((s) => {
              const on = value.includes(s.id);
              const dim = reachedMax && !on;
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  disabled={dim}
                  className={cn(
                    "group relative h-44 cursor-pointer overflow-hidden rounded-2xl text-left transition-all duration-200",
                    on
                      ? "shadow-[0_0_0_2.5px_#141414,0_8px_24px_-4px_rgba(0,0,0,0.3)] scale-[1.02]"
                      : "hover:scale-[1.01] hover:shadow-lg",
                    dim && "opacity-30 cursor-not-allowed"
                  )}
                >
                  {/* Image */}
                  <SmartImage src={s.image} alt={s.name} seed={s.id} label={s.name} fill />

                  {/* Gradient overlay */}
                  <div
                    className={cn(
                      "absolute inset-0 transition-opacity duration-200",
                      "bg-gradient-to-t from-black/75 via-black/10 to-transparent",
                      on ? "opacity-90" : "opacity-70 group-hover:opacity-80"
                    )}
                  />

                  {/* Selected check */}
                  {on && (
                    <span className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full bg-coral text-white shadow-lg ring-2 ring-white/30 animate-in zoom-in-50 duration-150">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check
                      </span>
                    </span>
                  )}

                  {/* Label */}
                  <div className="absolute inset-x-3 bottom-3 flex items-end justify-between">
                    <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/90 drop-shadow-sm">
                      {s.name}
                    </span>
                    {on && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* ── Sticky CTA ── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white dark:from-onboard-dark to-transparent z-[1]" />
      <div className="relative z-[2] shrink-0 px-6 pb-8 pt-4 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={onNext}
            disabled={value.length === 0}
            className={cn(
              "group relative flex h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl font-bold tracking-[0.04em] text-white shadow-xl transition-all duration-200 active:scale-[0.98]",
              value.length === 0
                ? "bg-black/10 dark:bg-white/10 text-mid-grey shadow-none cursor-not-allowed"
                : "bg-coral hover:bg-coral-deep shadow-coral/30"
            )}
          >
            {/* Shimmer */}
            {value.length > 0 && (
              <span className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-[200%]" />
            )}
            <span className="relative text-[13px]">Continue</span>
            <span className="relative material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </>
  );
}



// ── S-05 · Photo Upload / Model Select ──
type PhotoState = "idle" | "uploading" | "uploaded" | "processing" | "error";

function FitProfileStep({
  value,
  onChange,
  onBack,
  onComplete,
  onSkip,
}: {
  value: { photo?: string; modelId?: string };
  onChange: (v: { photo?: string; modelId?: string }) => void;
  onBack: () => void;
  onComplete: (fp: { photo?: string; modelId?: string }) => void;
  onSkip: () => void;
}) {
  const { presetModels } = useApp();
  const [photo, setPhoto] = useState<PhotoState>("idle");
  const [photoUrl, setPhotoUrl] = useState<string>(value.photo ?? "");
  const [photoErr, setPhotoErr] = useState("");
  const [progress, setProgress] = useState(0);
  const [modelId, setModelId] = useState<string | null>(value.modelId ?? null);
  const fileRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const onFile = (file?: File) => {
    if (!file) return;
    setPhotoErr("");
    if (file.size > 10 * 1024 * 1024) {
      setPhoto("error");
      setPhotoErr("Photo too large. Please use an image under 10MB.");
      return;
    }
    setPhoto("uploading");
    setProgress(0);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const pi = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(pi);
          intervalRef.current = null;
          setPhotoUrl(url);
          setPhoto("uploaded");
          setModelId(null);
          return 100;
        }
        return p + 20;
      });
    }, 220);
    intervalRef.current = pi;
  };

  const photoSelected = photo === "uploaded";
  const modelSelected = !!modelId;
  const hasSelection = photoSelected || modelSelected;

  return (
    <>
      {/* ── Header ── */}
      <header className="relative flex shrink-0 items-center justify-between bg-white dark:bg-onboard-dark px-6 py-5 z-10">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/8 text-ink dark:text-white/80 transition-all hover:bg-black/10 dark:hover:bg-white/12 active:scale-95"
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <span className="h-[3px] w-3 rounded-full bg-black/10 dark:bg-white/15" />
          <span className="h-[3px] w-8 rounded-full bg-coral" />
        </div>

        <button
          onClick={onSkip}
          className="text-[11px] font-bold uppercase tracking-[0.12em] text-mid-grey transition-all hover:text-ink dark:hover:text-white/80"
        >
          Skip
        </button>
      </header>

      <main className="no-scrollbar flex-grow min-h-0 overflow-y-auto pb-24">
        <div className="mx-auto max-w-4xl px-6 pt-4 md:px-10 lg:px-16">
          <h1 className="mb-2 font-serif text-[32px] font-normal italic leading-[1.1] tracking-tight text-ink dark:text-white md:text-[38px]">
            Set up your<br />fit profile
          </h1>
          <p className="mb-8 text-[14px] leading-relaxed text-mid-grey dark:text-zinc-400">
            Optional — you can add a photo anytime from your profile.
          </p>

        <div className="flex flex-col gap-8">
          {/* Option 1: Upload Photo */}
          <section>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-mid-grey dark:text-zinc-500">
              Option 1 — Upload a photo
            </h2>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className={cn(
                "group relative flex w-full flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center transition-all duration-200 hover:border-coral/50 hover:bg-coral/[0.03]",
                photo === "error"
                  ? "border-error bg-error/5"
                  : "border-black/15 dark:border-white/10"
              )}
            >
              {photo === "idle" || photo === "error" ? (
                <>
                  <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-black/5 dark:bg-white/5 transition-colors group-hover:bg-coral/10">
                    <span className="material-symbols-outlined text-[28px] text-mid-grey group-hover:text-coral transition-colors">
                      photo_camera
                    </span>
                  </span>
                  <p className="mb-1 text-[14px] font-bold text-ink dark:text-white">
                    Take or upload a photo
                  </p>
                  <p className="text-[12px] text-mid-grey dark:text-zinc-500">
                    For the most accurate fit mapping
                  </p>
                  {photoErr && (
                    <p className="mt-3 text-[12px] text-error">{photoErr}</p>
                  )}
                </>
              ) : photo === "uploading" ? (
                <div className="flex flex-col items-center gap-3">
                  <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-black/10 dark:text-white/10" />
                    <circle
                      cx="18" cy="18" r="15"
                      fill="none" stroke="currentColor" strokeWidth="2.5"
                      className="text-ink dark:text-white"
                      strokeDasharray={`${(progress / 100) * 94.2} 94.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-[13px] font-bold text-ink dark:text-white">Uploading…</span>
                </div>
              ) : (
                <>
                  <SmartImage src={photoUrl} alt="Your photo" className="absolute inset-0 h-full w-full rounded-2xl object-cover" />
                  <div className="absolute inset-0 rounded-2xl bg-black/25" />
                  <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-success text-white shadow-lg ring-2 ring-white/30">
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </span>
                </>
              )}
            </button>
          </section>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-black/8 dark:bg-white/8" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-zinc-600">or</span>
            <div className="h-px flex-1 bg-black/8 dark:bg-white/8" />
          </div>

          {/* Option 2: Preset Models */}
          <section className="-mx-6 px-6 md:mx-0 md:px-0">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-mid-grey dark:text-zinc-500">
              Option 2 — Choose a preset model
            </h2>
            <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
              {presetModels.map((m, idx) => {
                const selected = modelId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setModelId(modelId === m.id ? null : m.id); setPhoto("idle"); }}
                    className={cn(
                      "relative w-[110px] shrink-0 snap-start cursor-pointer transition-all duration-200",
                      selected ? "scale-[1.04]" : "hover:scale-[1.02]",
                      idx === presetModels.length - 1 && "pr-6 md:pr-0"
                    )}
                  >
                    <div className={cn(
                      "relative aspect-[3/4] overflow-hidden rounded-xl transition-all duration-200",
                      selected
                        ? "shadow-[0_0_0_2.5px_#141414,0_8px_20px_-4px_rgba(0,0,0,0.25)]"
                        : "shadow-sm hover:shadow-md"
                    )}>
                      <SmartImage src={m.thumb} alt={m.name} seed={m.id} className="h-full w-full" />
                      {selected && (
                        <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-coral text-white shadow ring-2 ring-white/30">
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        </span>
                      )}
                      <div className={cn(
                        "absolute inset-0 rounded-xl bg-gradient-to-t from-black/40 to-transparent transition-opacity",
                        selected ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                      )} />
                    </div>
                    <p className={cn(
                      "mt-1.5 text-center text-[10px] font-bold uppercase tracking-[0.1em] transition-colors",
                      selected ? "text-coral" : "text-mid-grey dark:text-zinc-500"
                    )}>
                      {m.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
        </div>
      </main>

      {/* ── Sticky CTA ── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white dark:from-onboard-dark to-transparent z-[1]" />
      <div className="relative z-[2] shrink-0 px-6 pb-8 pt-4 md:px-10 lg:px-16">
        <button
          onClick={() =>
            onComplete({
              photo: photoSelected ? photoUrl : undefined,
              modelId: modelId ?? undefined,
            })
          }
          disabled={photo === "uploading"}
          className={cn(
            "group relative mx-auto flex h-14 w-full max-w-md items-center justify-center gap-2.5 overflow-hidden rounded-2xl font-bold tracking-[0.04em] text-white shadow-xl transition-all duration-200 active:scale-[0.98]",
            photo === "uploading"
              ? "bg-black/10 dark:bg-white/10 text-mid-grey shadow-none cursor-not-allowed"
              : "bg-coral hover:bg-coral-deep shadow-coral/30"
          )}
        >
          <span className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-[200%]" />
          <span className="relative text-[13px]">
            {hasSelection ? "Done — Take me to Studio" : "Skip for now"}
          </span>
          <span className="relative material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </>
  );
}
