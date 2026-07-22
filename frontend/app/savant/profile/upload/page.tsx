"use client";

import { useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/consumer/store";
import { authApi } from "@/lib/api/auth";
import { SmartImage } from "@/components/consumer/SmartImage";

type PhotoState = "idle" | "uploading" | "uploaded" | "processing" | "error";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected photo."));
    reader.readAsDataURL(file);
  });
}

function UploadPhotoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/savant/feed";

  const { user, setUser, toast } = useApp();
  const [photo, setPhoto] = useState<PhotoState>("idle");
  const [photoUrl, setPhotoUrl] = useState<string>(user.fitProfile?.photo ?? "");
  const [photoErr, setPhotoErr] = useState("");
  const [progress, setProgress] = useState(0);
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    setFileObject(file);
    const url = URL.createObjectURL(file);
    const pi = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(pi);
          setPhotoUrl(url);
          setPhoto("uploaded");
          return 100;
        }
        return p + 20;
      });
    }, 220);
  };

  const handleComplete = async () => {
    if (photo !== "uploaded" && !photoUrl) {
      toast("Please upload a photo first.", "warn");
      return;
    }

    setSubmitting(true);

    try {
      let finalPhotoUrl = fileObject ? await fileToDataUrl(fileObject) : photoUrl;

      // Prefer the backend when available, but retain a persistent local copy
      // so try-on can continue even when the API is offline.
      if (!user.isGuest && fileObject) {
        try {
          const res = await authApi.uploadProfilePhoto(fileObject);
          if (typeof res.fitPhoto === "string" && res.fitPhoto.length > 0) {
            finalPhotoUrl = `data:image/jpeg;base64,${res.fitPhoto}`;
          }
        } catch {
          toast("Photo saved locally. You can continue to try on.", "neutral");
        }
      }

      setUser({
        avatar: finalPhotoUrl,
        fitProfile: {
          ...user.fitProfile,
          photo: finalPhotoUrl,
          modelId: undefined, // Clear preset model since they uploaded their own photo
        },
      });

      toast("Fit profile photo updated!", "success");
      router.replace(returnUrl);
    } catch (err: any) {
      toast("Failed to save photo to database: " + (err.message || err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const ready = photo === "uploaded" || !!photoUrl;

  return (
    <div className="flex h-full flex-col bg-surface-lowest dark:bg-canvas-dark font-body">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between bg-white dark:bg-surface-dark px-page-x py-4 border-b border-line dark:border-white/10">
        <button
          onClick={() => router.back()}
          className="text-ink dark:text-white transition-transform hover:opacity-80 active:scale-95 flex items-center justify-center h-9 w-9 rounded-full hover:bg-surface-low dark:hover:bg-white/5"
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_left</span>
        </button>
        <h1 className="font-display text-title-md font-bold text-ink dark:text-white">Try-On Setup</h1>
        <span className="w-9" />
      </header>

      {/* Main Content */}
      <main className="no-scrollbar flex-grow overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-md">
          <h2 className="mb-2 text-center font-display text-display-md font-bold text-ink dark:text-white md:text-left">
            Upload your photo
          </h2>
          <p className="mb-8 text-center font-body text-body-md text-mid-grey dark:text-white/60 md:text-left">
            To use the virtual try-on feature, please upload a clear, full-body photo of yourself.
          </p>

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
              "group relative flex aspect-[3/4] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all hover:bg-surface-low dark:hover:bg-white/5",
              photo === "error" ? "border-error" : "border-line/60 dark:border-white/20 hover:border-teal"
            )}
          >
            {photo === "idle" && !photoUrl ? (
              <>
                <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-surface-highest dark:bg-white/8 transition-colors group-hover:bg-teal-container">
                  <span className="material-symbols-outlined text-[32px] text-ink-variant dark:text-white/60 group-hover:text-white">photo_camera</span>
                </span>
                <p className="mb-1 font-body text-body-lg-bold font-bold text-ink dark:text-white">Take or upload a photo</p>
                <p className="font-body text-body-md text-mid-grey dark:text-white/50">Clear lighting, facing the camera</p>
              </>
            ) : photo === "uploading" ? (
              <div className="flex flex-col items-center">
                <div className="relative h-16 w-16">
                  <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-line dark:text-white/15" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="currentColor"
                      className="text-ink dark:text-white"
                      strokeWidth="3"
                      strokeDasharray={`${(progress / 100) * 94.2} 94.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-display text-[12px] font-bold text-teal">
                    {progress}%
                  </span>
                </div>
                <span className="mt-4 font-body text-label-bold font-bold text-ink dark:text-white">Uploading your photo…</span>
              </div>
            ) : (
              <>
                <SmartImage src={photoUrl} alt="Your photo" className="absolute inset-0 h-full w-full object-cover rounded-2xl" />
                <div className="absolute inset-0 bg-black/25 rounded-2xl transition-opacity group-hover:opacity-40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 shadow-md mb-2">
                    <span className="material-symbols-outlined text-ink text-[24px]">photo_camera</span>
                  </span>
                  <span className="font-display text-sm font-bold text-white">Change Photo</span>
                </div>
                <span className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-success text-white shadow">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </span>
              </>
            )}
          </button>
          
          {photoErr && <p className="mt-3 text-center text-caption text-error font-semibold">{photoErr}</p>}
        </div>
      </main>

      {/* Footer */}
      <div className="shrink-0 bg-gradient-to-t from-surface-lowest dark:from-canvas-dark via-surface-lowest dark:via-canvas-dark to-transparent px-page-x pb-8 pt-6 border-t border-line dark:border-white/10">
        <div className="mx-auto max-w-md">
          <button
            onClick={handleComplete}
            disabled={!ready || photo === "uploading" || submitting}
            className="flex h-btn-lg w-full items-center justify-center gap-2 rounded-full bg-coral font-body text-body-lg-bold text-white shadow-lg transition-all hover:bg-coral-deep active:scale-[0.98] disabled:opacity-40"
          >
            {submitting ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                Continue to Try On
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UploadPhotoPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center dark:bg-canvas-dark">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-line dark:border-white/10 border-t-teal" />
      </div>
    }>
      <UploadPhotoContent />
    </Suspense>
  );
}
