import { apiJson } from "./client";
import type { Look, Product } from "../consumer/types";

export interface FeedPage {
  items: Look[];
  nextCursor: number | null;
}

export type RankingWindow = "today" | "week" | "all";

export const recommendationApi = {
  async getFeed(cursor?: number, limit = 5, window?: RankingWindow): Promise<FeedPage> {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (cursor !== null && cursor !== undefined) {
      params.set("cursor", String(cursor));
    }
    if (window) params.set("window", window);
    return apiJson<FeedPage>(`/api/backend/recommendations/feed?${params.toString()}`);
  },

  async getRankings(window: RankingWindow): Promise<Look[]> {
    const page = await this.getFeed(undefined, 100, window);
    return page.items;
  },

  async getExplore(): Promise<Product[]> {
    return apiJson<Product[]>("/api/backend/recommendations/explore");
  },

  async getForYou(): Promise<Product[]> {
    return apiJson<Product[]>("/api/backend/recommendations/for-you");
  },

  async getSimilar(productId: string): Promise<Product[]> {
    return apiJson<Product[]>(`/api/backend/recommendations/similar/${productId}`);
  },
};
