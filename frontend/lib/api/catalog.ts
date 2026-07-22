import { apiJson, apiFetch } from "./client";
import type {
  ArtStyle,
  Artist,
  Backdrop,
  Look,
  PresetModel,
  Product,
  Vendor,
} from "../consumer/types";

export const catalogApi = {
  async getArtStyles(): Promise<ArtStyle[]> {
    return apiJson<ArtStyle[]>("/api/backend/catalog/art-styles");
  },

  async getPresetModels(): Promise<PresetModel[]> {
    return apiJson<PresetModel[]>("/api/backend/catalog/preset-models");
  },

  async getArtists(): Promise<Artist[]> {
    return apiJson<Artist[]>("/api/backend/catalog/artists");
  },

  async getBackdrops(): Promise<Backdrop[]> {
    return apiJson<Backdrop[]>("/api/backend/catalog/backdrops");
  },

  async getVendors(): Promise<Vendor[]> {
    return apiJson<Vendor[]>("/api/backend/catalog/vendors");
  },

  async getProducts(): Promise<Product[]> {
    return apiJson<Product[]>("/api/backend/catalog/products");
  },

  async getProductById(id: string): Promise<Product> {
    return apiJson<Product>(`/api/backend/catalog/products/${id}`);
  },

  async getLooks(): Promise<Look[]> {
    return apiJson<Look[]>("/api/backend/catalog/looks");
  },

  async tryOnProduct(
    productId: string,
    garmentUrl?: string
  ): Promise<{ image: string; galleryId?: string; cached?: boolean }> {
    // Routed through the /api/backend/* middleware proxy. The proxy runs in the
    // Node.js runtime (see middleware.ts) specifically so long-running AI calls
    // like this one (Agnes, 30-110s) aren't killed by the Edge ~30s timeout —
    // so there's no need to call the backend cross-origin, and we avoid a
    // production CORS dependency.
    return apiJson<{ image: string; galleryId?: string; cached?: boolean }>(
      "/api/backend/catalog/tryon",
      {
        method: "POST",
        body: { productId, garmentUrl },
      },
    );
  },

  async getGallery(): Promise<
    Array<{
      id: string;
      productId: string;
      productName: string;
      imageBase64: string;
      createdAt: string;
    }>
  > {
    return apiJson("/api/backend/catalog/tryon/gallery");
  },

  async deleteGalleryItem(id: string): Promise<void> {
    await apiFetch(`/api/backend/catalog/tryon/gallery/${id}`, {
      method: "DELETE",
    });
  },
};
