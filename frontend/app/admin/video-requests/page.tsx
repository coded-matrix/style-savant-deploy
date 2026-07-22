"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clapperboard,
  Loader2,
  Check,
  X,
  Upload,
  Search,
  PlayCircle,
  Hourglass,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  videoRequestApi,
  AdminVideoCampaignRequest,
  VideoRequestStatus,
} from "@/lib/api/video-request";
import { uploadApi } from "@/lib/api/upload";

const STATUS_LABEL: Record<VideoRequestStatus, string> = {
  pending: "New",
  accepted: "Accepted",
  in_progress: "In production",
  delivered: "Delivered",
  rejected: "Declined",
};

const STATUS_STYLE: Record<VideoRequestStatus, string> = {
  pending: "bg-warn/10 text-warn",
  accepted: "bg-ink/10 text-ink dark:bg-white/10 dark:text-white/80",
  in_progress: "bg-ink/10 text-ink dark:bg-white/10 dark:text-white/80",
  delivered: "bg-success/10 text-success",
  rejected: "bg-error/10 text-error",
};

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : "";
}

/**
 * Admin console for AI video campaign requests from vendors: accept with a
 * promised delivery date, decline, mark in production, and upload the
 * finished video to deliver (charges the vendor 20 tokens).
 */
export default function AdminVideoRequestsPage() {
  const [requests, setRequests] = useState<AdminVideoCampaignRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  // Per-request delivery-date input (admin promises this on accept).
  const [dates, setDates] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRequests(await videoRequestApi.adminInbox());
      setError(null);
    } catch (err) {
      setError((err as Error).message || "Could not load requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (
    id: string,
    body: { status?: VideoRequestStatus; videoUrl?: string; expectedDeliveryAt?: string },
  ) => {
    setBusyId(id);
    try {
      const updated = await videoRequestApi.update(id, body);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    } catch (err) {
      setError((err as Error).message || "Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const accept = (r: AdminVideoCampaignRequest) => {
    const date = dates[r.id];
    void patch(r.id, {
      status: "accepted",
      ...(date ? { expectedDeliveryAt: new Date(`${date}T12:00:00Z`).toISOString() } : {}),
    });
  };

  const pickVideo = (id: string) => {
    uploadTargetRef.current = id;
    fileRef.current?.click();
  };

  const onVideoPicked = async (files: FileList | null) => {
    const id = uploadTargetRef.current;
    const file = files?.[0];
    if (!id || !file) return;
    if (!file.type.startsWith("video/")) {
      setError("Please choose an MP4 or WebM video.");
      return;
    }
    setUploadingId(id);
    try {
      const [url] = await uploadApi.uploadImages([file]);
      const updated = await videoRequestApi.update(id, { status: "delivered", videoUrl: url });
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    } catch (err) {
      setError((err as Error).message || "Delivery failed.");
    } finally {
      setUploadingId(null);
      uploadTargetRef.current = null;
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const filtered = requests.filter((r) =>
    query
      ? `${r.conceptTitle ?? ""} ${r.brief} ${r.businessName ?? ""} ${r.productName ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      : true,
  );

  const openCount = requests.filter((r) =>
    ["pending", "accepted", "in_progress"].includes(r.status),
  ).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink dark:text-white">
          AI Video Requests
        </h1>
        <p className="text-sm text-mid-grey dark:text-white/60">
          Campaign requests from businesses — {openCount} open
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/webm"
        className="hidden"
        onChange={(e) => onVideoPicked(e.target.files)}
      />

      {error ? (
        <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      ) : null}

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mid-grey" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by business, concept, product…"
          className="w-full rounded-full border border-line bg-white py-2.5 pl-9 pr-4 text-sm text-ink outline-none focus:border-ink dark:border-white/10 dark:bg-surface-dark dark:text-white dark:focus:border-white/40"
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-mid-grey" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-mid-grey dark:text-white/60">
          {requests.length === 0 ? "No campaign requests yet." : "No requests match your search."}
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const expanded = expandedId === r.id;
            const busy = busyId === r.id || uploadingId === r.id;
            return (
              <div
                key={r.id}
                className="overflow-hidden rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : r.id)}
                  className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-surface-low/50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink text-white dark:bg-white/10">
                    <Clapperboard className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink dark:text-white">
                      {r.businessName ?? "Business"} · {r.conceptTitle ?? "Campaign"}
                    </p>
                    <p className="truncate text-xs text-mid-grey dark:text-white/60">
                      {fmt(r.createdAt)}
                      {r.productName ? ` · ${r.productName}` : ""}
                      {r.expectedDeliveryAt ? ` · due ${fmt(r.expectedDeliveryAt)}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
                      STATUS_STYLE[r.status],
                    )}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </button>

                {expanded ? (
                  <div className="space-y-4 border-t border-line bg-surface-low/50 p-5 dark:border-white/10 dark:bg-white/[0.02]">
                    <p className="whitespace-pre-wrap text-sm text-ink dark:text-white/90">{r.brief}</p>

                    {r.referenceImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.referenceImageUrl}
                        alt="Reference"
                        className="h-28 w-28 rounded-lg object-cover ring-1 ring-line dark:ring-white/10"
                      />
                    ) : null}

                    {r.videoUrl ? (
                      <video
                        src={r.videoUrl}
                        controls
                        className="max-h-64 rounded-lg ring-1 ring-line dark:ring-white/10"
                      />
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 dark:border-white/10">
                      {r.status === "pending" ? (
                        <>
                          <label className="flex items-center gap-1.5 text-xs text-mid-grey dark:text-white/60">
                            <CalendarClock className="h-3.5 w-3.5" />
                            Deliver by
                            <input
                              type="date"
                              value={dates[r.id] ?? ""}
                              onChange={(e) =>
                                setDates((prev) => ({ ...prev, [r.id]: e.target.value }))
                              }
                              className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink dark:border-white/10 dark:bg-surface-dark dark:text-white"
                            />
                          </label>
                          <button
                            onClick={() => accept(r)}
                            disabled={busy}
                            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white disabled:opacity-50 dark:bg-white dark:text-ink"
                          >
                            <Check className="h-3 w-3" /> Accept
                          </button>
                          <button
                            onClick={() => patch(r.id, { status: "rejected" })}
                            disabled={busy}
                            className="flex items-center gap-1.5 rounded-full border border-error/30 px-4 py-2 text-xs font-bold text-error disabled:opacity-50"
                          >
                            <X className="h-3 w-3" /> Decline
                          </button>
                        </>
                      ) : null}

                      {r.status === "accepted" ? (
                        <button
                          onClick={() => patch(r.id, { status: "in_progress" })}
                          disabled={busy}
                          className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-bold text-ink disabled:opacity-50 dark:border-white/10 dark:text-white"
                        >
                          <Hourglass className="h-3 w-3" /> Mark in production
                        </button>
                      ) : null}

                      {r.status === "accepted" || r.status === "in_progress" ? (
                        <button
                          onClick={() => pickVideo(r.id)}
                          disabled={busy}
                          className="flex items-center gap-1.5 rounded-full bg-success px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {uploadingId === r.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                          Upload video & deliver (charges 20 tk)
                        </button>
                      ) : null}

                      {r.status === "delivered" && r.videoUrl ? (
                        <a
                          href={r.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-bold text-ink dark:border-white/10 dark:text-white"
                        >
                          <PlayCircle className="h-3 w-3" /> View delivered video
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
