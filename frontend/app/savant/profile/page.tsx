"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useApp } from "@/lib/consumer/store";
import { compactCount } from "@/lib/consumer/format";
import { SmartImage } from "@/components/consumer/SmartImage";
import { Skeleton } from "@/components/consumer/Skeleton";
import { BottomSheet } from "@/components/consumer/BottomSheet";
import { Button } from "@/components/consumer/Button";
import { BottomNav } from "@/components/consumer/BottomNav";
import { Input } from "@/components/consumer/Input";
import { catalogApi } from "@/lib/api/catalog";
import { MeasurementEditor } from "@/components/consumer/MeasurementEditor";
import type { GalleryItem, Size } from "@/lib/consumer/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout, toast } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [photoError, setPhotoError] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Measurements editor
  const [measureOpen, setMeasureOpen] = useState(false);
  const [tailorOpen, setTailorOpen] = useState(false);
  const [topSize, setTopSize] = useState(user.fitProfile?.sizes?.Top || "");
  const [bottomSize, setBottomSize] = useState(user.fitProfile?.sizes?.Bottom || "");
  const [shoeSize, setShoeSize] = useState(user.fitProfile?.sizes?.Shoes || "");
  const [height, setHeight] = useState(user.fitProfile?.height || "");

  // Gallery lightbox
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoadingProfile(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user.isGuest) {
      setLoadingGallery(true);
      catalogApi
        .getGallery()
        .then(setGallery)
        .catch(() => toast("Failed to load try-on gallery.", "error"))
        .finally(() => setLoadingGallery(false));
    }
  }, [user.isGuest]);

  // Sync measurements when user data changes
  useEffect(() => {
    setTopSize(user.fitProfile?.sizes?.Top || "");
    setBottomSize(user.fitProfile?.sizes?.Bottom || "");
    setShoeSize(user.fitProfile?.sizes?.Shoes || "");
    setHeight(user.fitProfile?.height || "");
  }, [user.fitProfile]);

  const handleDeleteGalleryItem = async (id: string) => {
    try {
      await catalogApi.deleteGalleryItem(id);
      setGallery((prev) => prev.filter((item) => item.id !== id));
      toast("Removed from gallery.", "success");
    } catch {
      toast("Failed to remove gallery item.", "error");
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast("Photo too large. Please use an image under 10MB.", "error");
      return;
    }
    const url = URL.createObjectURL(file);
    setUser({
      avatar: url,
      fitProfile: {
        ...user.fitProfile,
        photo: url,
        modelId: undefined,
      },
    });
    setPhotoError(false);
    toast("Profile photo updated!", "success");
  };

  const handleSaveMeasurements = () => {
    setUser({
      fitProfile: {
        ...user.fitProfile,
        sizes: {
          Top: (topSize || undefined) as Size | undefined,
          Bottom: (bottomSize || undefined) as Size | undefined,
          Shoes: shoeSize || undefined,
        },
        height: height || undefined,
      },
    });
    setMeasureOpen(false);
    toast("Measurements saved!", "success");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const hasAvatar = user.avatar && !photoError;

  return (
    <div className="relative flex h-full flex-col bg-surface-bright dark:bg-canvas-dark overflow-hidden pb-[76px] md:pb-0 font-body text-body-md">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* Mobile TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface-bright dark:bg-canvas-dark flex justify-between items-center px-6 py-4 md:hidden">
        <h1 className="font-display text-[26px] leading-[32px] font-bold text-ink dark:text-white">Profile</h1>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-ink dark:text-white hover:opacity-80 active:scale-95 transition-transform"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-[24px]">settings</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-6 md:px-16 lg:px-24 pt-[72px] pb-28 md:pt-6">
        <div className="mx-auto max-w-[1200px]">
        {/* guest banner */}
        {user.isGuest && (
          <div className="mt-3 rounded-card border border-line/60 bg-surface-low p-5 dark:border-white/10 dark:bg-white/5">
            <p className="font-display text-[16px] leading-[22px] font-bold text-ink dark:text-off-white">You&apos;re browsing as a guest.</p>
            <p className="mt-1 text-caption text-mid-grey dark:text-white/60">Create an account to save your looks and vote.</p>
            <Button
              variant="coral"
              size="md"
              full
              className="mt-4"
              onClick={() => router.push("/savant/auth")}
            >
              <span className="text-[9px] tracking-[0.04em] sm:text-[11px]">
                Create account to save your looks
              </span>
            </Button>
          </div>
        )}

        {/* Profile Header */}
        {user.isGuest ? (
          <section className="flex items-center gap-4 py-6">
            <div className="relative w-20 h-20 shrink-0">
              <span className="block w-full h-full overflow-hidden rounded-full bg-gradient-to-br from-ink to-ink-variant">
                <SmartImage src={user.avatar} alt={user.username} seed={user.username} className="h-full w-full object-cover" />
              </span>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-ink text-off-white p-1 rounded-full hover:opacity-80 transition-opacity border border-white flex items-center justify-center dark:bg-off-white dark:text-ink"
                aria-label="Edit photo"
              >
                <span className="material-symbols-outlined text-[16px] font-bold">photo_camera</span>
              </button>
            </div>
            <div>
              <h2 className="font-display text-[20px] leading-[26px] font-bold text-ink dark:text-off-white">Guest</h2>
              <p className="text-body-md text-mid-grey dark:text-white/60">0 looks posted · 0 votes received</p>
            </div>
          </section>
        ) : loadingProfile ? (
          <section className="flex flex-col items-center py-6 gap-4">
            <Skeleton className="w-32 h-32 rounded-full" />
            <Skeleton className="w-40 h-6 rounded" />
            <Skeleton className="w-28 h-4 rounded" />
            <div className="flex gap-10 mt-2 w-full justify-center">
              <Skeleton className="w-12 h-8 rounded" />
              <Skeleton className="w-12 h-8 rounded" />
              <Skeleton className="w-12 h-8 rounded" />
            </div>
          </section>
        ) : (
          <section className="flex flex-col items-center py-6">
            <div className="relative w-32 h-32 mb-4 shrink-0">
              {hasAvatar ? (
                <span className="block w-full h-full overflow-hidden rounded-full ring-4 ring-white dark:ring-white/20 border border-line dark:border-white/10">
                  <SmartImage src={user.avatar} alt={user.username} seed={user.username} className="h-full w-full object-cover" />
                </span>
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-ink to-ink-variant flex items-center justify-center ring-4 ring-white dark:ring-white/20">
                  <span className="font-display text-[42px] font-bold text-white/90 select-none">
                    {getInitials(user.username || "SC")}
                  </span>
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-ink text-off-white p-2 rounded-full hover:opacity-80 transition-opacity flex items-center justify-center dark:bg-off-white dark:text-ink"
                aria-label="Edit photo"
              >
                <span className="material-symbols-outlined text-[20px] font-bold">edit</span>
              </button>
            </div>

            <h2 className="font-display text-[24px] leading-[30px] font-bold text-ink dark:text-white tracking-[-0.01em]">
              {user.username}
            </h2>
            <p className="mt-0.5 text-[14px] text-mid-grey dark:text-white/50 tracking-wide">
              @{user.username.toLowerCase().replace(/\s+/g, '_')}
            </p>
          </section>
        )}

        {/* Fit Profile */}
        <section className="mt-8">
          <h3 className="font-display text-[18px] leading-[24px] font-bold text-ink dark:text-white mb-4">Fit Profile</h3>
          {user.isGuest ? (
            <div className="flex gap-4 items-center">
              <div className="w-[84px] h-[84px] rounded-[18px] border border-ink/40 bg-ink/[0.02] flex flex-col items-center justify-center p-2 shrink-0 dark:border-white/20 dark:bg-white/[0.02]">
                <span className="text-[12px] font-semibold text-mid-grey dark:text-white/60">No photo</span>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-ink dark:text-off-white text-label-bold text-left link-wipe"
                >
                  Update Photo
                </button>
                <div className="flex gap-2">
                  <div className="flex-1 bg-surface-low dark:bg-white/5 rounded-[18px] p-2 text-center flex flex-col justify-center h-12">
                    <span className="text-[10px] text-mid-grey dark:text-white/60 uppercase tracking-wider font-bold leading-none">Top</span>
                    <span className="font-bold text-ink dark:text-off-white text-[14px] mt-0.5">—</span>
                  </div>
                  <div className="flex-1 bg-surface-low dark:bg-white/5 rounded-[18px] p-2 text-center flex flex-col justify-center h-12">
                    <span className="text-[10px] text-mid-grey dark:text-white/60 uppercase tracking-wider font-bold leading-none">Bottom</span>
                    <span className="font-bold text-ink dark:text-off-white text-[14px] mt-0.5">—</span>
                  </div>
                  <div className="flex-1 bg-surface-low dark:bg-white/5 rounded-[18px] p-2 text-center flex flex-col justify-center h-12">
                    <span className="text-[10px] text-mid-grey dark:text-white/60 uppercase tracking-wider font-bold leading-none">Shoes</span>
                    <span className="font-bold text-ink dark:text-off-white text-[14px] mt-0.5">—</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 md:p-8 flex items-start gap-6 md:gap-8 border border-line dark:border-white/10 dark:bg-surface-dark ring-1 ring-line/50 dark:ring-white/10">
              <span className="w-24 md:w-32 h-32 md:h-44 rounded-lg overflow-hidden shrink-0 bg-surface-high ring-1 ring-line dark:ring-white/10">
                {user.fitProfile?.photo && !photoError ? (
                  <SmartImage src={user.fitProfile.photo} alt="You" seed="fitphoto" className="h-full w-full object-cover" />
                ) : user.fitProfile?.modelId ? (
                  <SmartImage src={`https://picsum.photos/seed/model-${user.fitProfile.modelId}/120/160`} alt="Model" seed={user.fitProfile.modelId} className="h-full w-full object-cover" />
                ) : (
                  <SmartImage src="https://picsum.photos/seed/model-m1/120/160" alt="Model" seed="m1" className="h-full w-full object-cover" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-caption text-mid-grey dark:text-white/60">Top Size</p>
                    <p className="font-bold text-ink dark:text-off-white">{user.fitProfile?.sizes?.Top || "Medium"}</p>
                  </div>
                  <div>
                    <p className="text-caption text-mid-grey dark:text-white/60">Bottom Size</p>
                    <p className="font-bold text-ink dark:text-off-white">{user.fitProfile?.sizes?.Bottom || "32 / M"}</p>
                  </div>
                  <div>
                    <p className="text-caption text-mid-grey dark:text-white/60">Shoe Size</p>
                    <p className="font-bold text-ink dark:text-off-white">{user.fitProfile?.sizes?.Shoes || "10 US"}</p>
                  </div>
                  <div>
                    <p className="text-caption text-mid-grey dark:text-white/60">Height</p>
                    <p className="font-bold text-ink dark:text-off-white">{user.fitProfile?.height || "6'1\""}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMeasureOpen(true)}
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-ink/5 px-2 text-[12px] sm:px-3 sm:text-[13px] font-bold text-ink transition-colors hover:bg-ink/10 dark:bg-white/10 dark:text-off-white dark:hover:bg-white/15"
                >
                  <span className="material-symbols-outlined shrink-0 text-[15px]">edit</span>
                  <span className="truncate">Edit sizes</span>
                </button>
                <button
                  onClick={() => setTailorOpen(true)}
                  className="mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-ink px-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90 sm:px-3 sm:text-[13px] dark:bg-white dark:text-ink"
                >
                  <span className="material-symbols-outlined shrink-0 text-[15px]">straighten</span>
                  <span className="truncate">Tailor measurements</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Gallery — horizontal scroll */}
        <section className="mt-12">
          <h3 className="font-display text-[18px] leading-[24px] font-bold text-ink dark:text-white mb-4">Gallery</h3>
          {user.isGuest ? (
            <div className="rounded-card border border-line dark:border-white/10 bg-white p-6 text-center ring-1 ring-line/50 dark:ring-white/10 dark:bg-surface-dark">
              <span className="material-symbols-outlined text-[36px] text-mid-grey dark:text-white/60 mb-2">photo_library</span>
              <p className="font-display text-[16px] leading-[22px] font-bold text-ink dark:text-off-white">Sign in to view your gallery</p>
              <p className="mt-1 text-body-sm text-mid-grey dark:text-white/60 mb-4">Your saved generated try-on looks will appear here.</p>
              <Button
                variant="coral"
                size="sm"
                onClick={() => router.push("/savant/auth")}
              >
                Log In / Sign Up
              </Button>
            </div>
          ) : loadingGallery ? (
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-36 h-48 rounded-card shrink-0" />
              ))}
            </div>
          ) : gallery.length === 0 ? (
            <div className="rounded-card border border-line dark:border-white/10 bg-white p-6 text-center ring-1 ring-line/50 dark:ring-white/10 dark:bg-surface-dark">
              <span className="material-symbols-outlined text-[36px] text-mid-grey dark:text-white/60 mb-2">style</span>
              <p className="font-display text-[16px] leading-[22px] font-bold text-ink dark:text-off-white">Your gallery is empty</p>
              <p className="mt-1 text-body-sm text-mid-grey dark:text-white/60 mb-4">Try on outfits in the studio to save and review looks.</p>
              <Button
                variant="coral"
                size="sm"
                onClick={() => router.push("/savant/studio")}
              >
                Go to Studio
              </Button>
            </div>
          ) : (
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 overflow-x-auto md:overflow-visible no-scrollbar pb-2 -mx-6 md:mx-0 md:px-0 px-6">
              {gallery.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                <div
                  onClick={() => setLightboxItem(item)}
                  className="group relative shrink-0 md:shrink w-[140px] md:w-full overflow-hidden rounded-xl bg-white ring-1 ring-line dark:ring-white/10 cursor-pointer transition-all active:scale-[0.98] dark:bg-surface-dark"
                >
                  <div className="aspect-[3/4] relative">
                    <img
                      src={`data:image/jpeg;base64,${item.imageBase64}`}
                      alt={`Try-on of ${item.productName}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2.5">
                    <p className="truncate font-display text-[11px] font-bold text-white">
                      {item.productName}
                    </p>
                    <p className="mt-0.5 font-body text-[9px] text-white/60">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGalleryItem(item.id);
                    }}
                    className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Delete"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Account Section */}
        {!user.isGuest && (
          <section className="mt-12">
            <h3 className="font-display text-[18px] leading-[24px] font-bold text-ink dark:text-white mb-4">Account</h3>
            <div className="bg-white rounded-xl overflow-hidden divide-y divide-line border border-line ring-1 ring-line/50 dark:divide-white/10 dark:border-white/10 dark:bg-surface-dark dark:ring-white/10">
              <button
                onClick={() => setLogoutOpen(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-low dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 text-error">
                  <span className="material-symbols-outlined">logout</span>
                  <span className="font-body text-body-lg-bold">Log Out</span>
                </div>
              </button>
            </div>
          </section>
        )}
        </div>
      </div>

      <BottomNav />

      {/* Tailor measurement sheet — full body, inch/cm toggle */}
      <BottomSheet
        open={tailorOpen}
        onClose={() => setTailorOpen(false)}
        title="Tailor measurements"
        height={92}
      >
        <MeasurementEditor
          onClose={() => setTailorOpen(false)}
          onSaved={() => toast("Measurements saved.", "success")}
        />
      </BottomSheet>

      {/* Quick sizes sheet */}
      <BottomSheet
        open={measureOpen}
        onClose={() => setMeasureOpen(false)}
        title="Edit sizes"
        height={60}
        footer={
          <Button variant="coral" full onClick={handleSaveMeasurements}>
            Save Measurements
          </Button>
        }
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Top Size"
            placeholder="e.g. Medium, L, 42"
            value={topSize}
            onChange={(e) => setTopSize(e.target.value)}
          />
          <Input
            label="Bottom Size"
            placeholder="e.g. 32 / M, 30W 32L"
            value={bottomSize}
            onChange={(e) => setBottomSize(e.target.value)}
          />
          <Input
            label="Shoe Size"
            placeholder="e.g. 10 US, 44 EU"
            value={shoeSize}
            onChange={(e) => setShoeSize(e.target.value)}
          />
          <Input
            label="Height"
            placeholder='e.g. 5&apos;10", 178 cm'
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
      </BottomSheet>

      {/* Gallery Lightbox */}
      <BottomSheet
        open={!!lightboxItem}
        onClose={() => setLightboxItem(null)}
        height={85}
        bare
      >
        {lightboxItem && (
          <div className="flex flex-col items-center pt-2">
            <div className="relative w-full max-w-sm mx-auto">
              <img
                src={`data:image/jpeg;base64,${lightboxItem.imageBase64}`}
                alt={`Try-on of ${lightboxItem.productName}`}
                className="w-full rounded-xl object-contain"
              />
            </div>
            <div className="mt-4 text-center">
              <p className="font-display text-[16px] font-bold text-ink dark:text-white">{lightboxItem.productName}</p>
              <p className="text-[12px] text-mid-grey dark:text-white/50 mt-0.5">
                {new Date(lightboxItem.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3 mt-5 pb-4">
              <Button
                variant="greyOutline"
                onClick={() => router.push(`/savant/studio?productId=${lightboxItem.productId}`)}
              >
                Try On Again
              </Button>
              <Button
                variant="coral"
                onClick={() => {
                  handleDeleteGalleryItem(lightboxItem.id);
                  setLightboxItem(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* settings sheet */}
      <BottomSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" height={55}>
        <div className="divide-y divide-line dark:divide-white/10">
          <button
            onClick={() => { setSettingsOpen(false); toast("About Style Savant · Accra, Ghana · 2026", "neutral"); }}
            className="w-full flex items-center gap-3 py-3 text-left hover:bg-surface-low dark:hover:bg-white/5 px-4"
          >
            <span className="material-symbols-outlined text-mid-grey dark:text-white/60">info</span>
            <span className="font-body text-sm font-bold text-ink dark:text-off-white">About Style Savant</span>
          </button>
          {!user.isGuest && (
            <>
              <button
                onClick={() => { setSettingsOpen(false); router.push("/savant/gallery"); }}
                className="w-full flex items-center gap-3 py-3 text-left hover:bg-surface-low dark:hover:bg-white/5 px-4"
              >
                <span className="material-symbols-outlined text-mid-grey dark:text-white/60">photo_library</span>
                <span className="font-body text-sm font-bold text-ink dark:text-off-white">My Gallery</span>
              </button>
              <button
                onClick={() => { setSettingsOpen(false); setLogoutOpen(true); }}
                className="w-full flex items-center gap-3 py-3 text-left hover:bg-surface-low dark:hover:bg-white/5 px-4 text-error"
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="font-body text-sm font-bold">Log Out</span>
              </button>
            </>
          )}
        </div>
      </BottomSheet>

      {/* logout confirm */}
      <BottomSheet
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        height={38}
        bare
        fitContent
        footer={
          <div className="flex gap-3">
            <Button variant="greyOutline" className="flex-1" onClick={() => setLogoutOpen(false)}>Cancel</Button>
            <Button variant="coral" className="flex-1" onClick={() => { logout(); router.replace("/savant"); }}>
              Log Out
            </Button>
          </div>
        }
      >
        <div className="px-2 pt-4 text-center">
          <p className="font-display text-title-md text-ink dark:text-off-white">Log out?</p>
          <p className="mt-1 text-body-md text-mid-grey dark:text-white/60">You&apos;ll need to sign in again.</p>
        </div>
      </BottomSheet>
    </div>
  );
}
