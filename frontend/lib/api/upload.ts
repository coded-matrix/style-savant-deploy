import { apiJson } from "./client";

/**
 * Upload image files to the backend object storage and get back persistent
 * public URLs (in the same order). Routed through the /api/backend/* proxy so
 * the vendor JWT is attached automatically.
 */
export const uploadApi = {
  async uploadImages(files: File[]): Promise<string[]> {
    if (files.length === 0) return [];
    const form = new FormData();
    for (const file of files) form.append("files", file);
    const res = await apiJson<{ urls: string[] }>("/api/backend/uploads", {
      method: "POST",
      body: form,
    });
    return res.urls;
  },
};
