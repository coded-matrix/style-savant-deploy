"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Clapperboard, Loader2, Send, Upload, PlayCircle, CalendarClock, X } from "lucide-react";
import { useVendor } from "@/context/VendorContext";
import { PageHeader, EmptyState } from "@/components/vendor/shared";
import { formatDate, cn } from "@/lib/utils";
import {
  videoRequestApi,
  VideoCampaignRequest,
  VideoRequestStatus,
} from "@/lib/api/video-request";
import { uploadApi } from "@/lib/api/upload";

const STATUS_LABEL: Record<VideoRequestStatus, string> = {
  pending: "Submitted",
  accepted: "Accepted",
  in_progress: "In production",
  delivered: "Delivered",
  rejected: "Declined",
};

const STATUS_STYLE: Record<VideoRequestStatus, string> = {
  pending: "bg-vendor-coral-bright/10 text-vendor-coral-bright",
  accepted: "bg-teal/10 text-teal",
  in_progress: "bg-teal/10 text-teal",
  delivered: "bg-teal/15 text-teal",
  rejected: "bg-mid-grey/10 text-mid-grey",
};

/**
 * Vendor-side AI Video Campaign page: the business fills out a campaign
 * request (concept, brief, optional product + reference image) which goes to
 * the platform admin, then tracks status / promised delivery date here and
 * watches the delivered video.
 */
export default function AiVideoCampaignPage() {
  const { toast, products } = useVendor();
  const [requests, setRequests] = useState<VideoCampaignRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Request form
  const [conceptTitle, setConceptTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [productId, setProductId] = useState("");
  const [refImageUrl, setRefImageUrl] = useState("");
  const [uploadingRef, setUploadingRef] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const refInputRef = useRef<HTMLInputElement>(null);

  const [playingId, setPlayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRequests(await videoRequestApi.mine());
    } catch {
      toast("Could not load your campaign requests.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefImage = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadingRef(true);
    try {
      const [url] = await uploadApi.uploadImages([file]);
      setRefImageUrl(url);
    } catch {
      toast("Reference image upload failed.", "error");
    } finally {
      setUploadingRef(false);
      if (refInputRef.current) refInputRef.current.value = "";
    }
  };

  const submit = async () => {
    if (conceptTitle.trim().length < 3) {
      toast("Give your campaign a concept title.", "error");
      return;
    }
    if (brief.trim().length < 10) {
      toast("Describe your concept in a bit more detail.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const created = await videoRequestApi.create({
        conceptTitle: conceptTitle.trim(),
        brief: brief.trim(),
        productId: productId || undefined,
        referenceImageUrl: refImageUrl || undefined,
      });
      setRequests((prev) => [created, ...prev]);
      setConceptTitle("");
      setBrief("");
      setProductId("");
      setRefImageUrl("");
      toast("Campaign request sent — we'll confirm a delivery date soon.", "success");
    } catch (err) {
      toast((err as Error).message || "Could not submit your request.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="AI Video Campaign"
        subtitle="Request a custom AI video for your brand — concept in, campaign out"
      />

      <div className="space-y-8 lg:grid lg:grid-cols-[5fr_6fr] lg:gap-10 lg:space-y-0 lg:items-start">
        {/* ── Request form ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-line bg-white p-6 dark:border-white/10 dark:bg-surface-dark space-y-4"
        >
          <p className="text-v-tsm font-bold text-ink dark:text-white/90">New campaign request</p>

          <div>
            <label className="mb-1 block text-v-meta font-bold text-ink dark:text-white/90">
              Concept title
            </label>
            <input
              value={conceptTitle}
              onChange={(e) => setConceptTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Sunset beach editorial — Drape Dress"
              className="vendor-input"
            />
          </div>

          <div>
            <label className="mb-1 block text-v-meta font-bold text-ink dark:text-white/90">
              Concept ideas & brief
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Describe the story, mood, setting, music vibe, target audience, and anything the video must include…"
              className="vendor-input resize-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-v-meta font-bold text-ink dark:text-white/90">
              Featured product (optional)
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="vendor-input"
            >
              <option value="">No specific product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-v-meta font-bold text-ink dark:text-white/90">
              Reference image (optional)
            </label>
            <input
              ref={refInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onRefImage(e.target.files)}
            />
            {refImageUrl ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={refImageUrl}
                  alt="Reference"
                  className="h-20 w-20 rounded-lg object-cover ring-1 ring-line dark:ring-white/10"
                />
                <button
                  onClick={() => setRefImageUrl("")}
                  className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-white dark:bg-white dark:text-ink"
                  aria-label="Remove reference image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => refInputRef.current?.click()}
                disabled={uploadingRef}
                className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-v-meta font-bold text-ink disabled:opacity-50 dark:border-white/10 dark:text-white/90"
              >
                {uploadingRef ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                Upload image
              </button>
            )}
          </div>

          <button
            onClick={submit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-vendor-coral-bright py-3 text-v-body font-bold text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit campaign request
          </button>
          <p className="text-center text-v-meta text-vendor-text-grey">
            The Style Savant team reviews every request and confirms a delivery date. Delivery costs 20 tokens.
          </p>
        </motion.div>

        {/* ── My requests ── */}
        <div className="space-y-4">
          <p className="text-v-tsm font-bold text-ink dark:text-white/90">My campaign requests</p>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-mid-grey" />
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              title="No campaign requests yet"
              hint="Fill in the form to request your first AI video campaign."
            />
          ) : (
            requests.map((r, index) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark"
              >
                <div className="flex items-start gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-vendor-container text-white">
                    <Clapperboard className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-v-tsm font-bold text-ink dark:text-white/90">
                      {r.conceptTitle ?? "Campaign request"}
                      {r.productName ? ` · ${r.productName}` : ""}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-v-meta text-vendor-text-grey">{r.brief}</p>
                    <p className="mt-1 text-v-meta text-vendor-text-grey">
                      {formatDate(r.createdAt)}
                      {r.expectedDeliveryAt ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-teal">
                          <CalendarClock className="h-3 w-3" />
                          Expected {formatDate(r.expectedDeliveryAt)}
                        </span>
                      ) : null}
                    </p>
                    {r.vendorNote ? (
                      <p className="mt-1 text-v-meta italic text-vendor-text-grey">“{r.vendorNote}”</p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-v-meta font-bold",
                      STATUS_STYLE[r.status],
                    )}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>

                {r.status === "delivered" && r.videoUrl ? (
                  playingId === r.id ? (
                    <video src={r.videoUrl} controls autoPlay playsInline className="max-h-80 w-full bg-black object-contain" />
                  ) : (
                    <button
                      onClick={() => setPlayingId(r.id)}
                      className="flex w-full items-center justify-center gap-2 border-t border-line py-3 text-v-body font-bold text-ink transition-colors hover:bg-surface-low dark:border-white/10 dark:text-white/90 dark:hover:bg-white/5"
                    >
                      <PlayCircle className="h-4 w-4" /> Watch your campaign video
                    </button>
                  )
                ) : null}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
