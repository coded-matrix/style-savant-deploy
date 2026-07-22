import { apiJson } from "./client";

/**
 * AI video campaigns — a vendor (business) requests an AI video from the
 * platform admin, who accepts, promises a delivery date, and delivers the
 * finished video.
 */

export type VideoRequestStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "delivered"
  | "rejected";

export interface VideoCampaignRequest {
  id: string;
  conceptTitle: string | null;
  brief: string;
  status: VideoRequestStatus;
  expectedDeliveryAt: string | null;
  videoUrl: string | null;
  vendorNote: string | null;
  referenceImageUrl: string | null;
  productId: string | null;
  productName: string | null;
  createdAt: string;
}

/** Admin inbox rows also carry the requesting business. */
export interface AdminVideoCampaignRequest extends VideoCampaignRequest {
  vendorId: string;
  businessName: string | null;
}

export const videoRequestApi = {
  /** Vendor: submit a campaign request to the admin. */
  async create(input: {
    conceptTitle: string;
    brief: string;
    productId?: string;
    referenceImageUrl?: string;
  }): Promise<VideoCampaignRequest> {
    return apiJson<VideoCampaignRequest>("/api/backend/video-requests", {
      method: "POST",
      body: input,
    });
  },

  /** Vendor: my campaign requests. */
  async mine(): Promise<VideoCampaignRequest[]> {
    return apiJson<VideoCampaignRequest[]>("/api/backend/video-requests/mine");
  },

  /** Admin: all campaign requests. */
  async adminInbox(): Promise<AdminVideoCampaignRequest[]> {
    return apiJson<AdminVideoCampaignRequest[]>("/api/backend/video-requests/admin");
  },

  /** Admin: triage or deliver a request. */
  async update(
    id: string,
    patch: {
      status?: VideoRequestStatus;
      videoUrl?: string;
      vendorNote?: string;
      expectedDeliveryAt?: string;
    },
  ): Promise<VideoCampaignRequest> {
    return apiJson<VideoCampaignRequest>(`/api/backend/video-requests/${id}`, {
      method: "PATCH",
      body: patch,
    });
  },
};
