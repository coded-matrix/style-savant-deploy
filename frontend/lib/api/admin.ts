import { apiFetch, type ApiFetchOptions } from "./client";

async function adminFetch(path: string, init?: ApiFetchOptions) {
  return apiFetch(`/api/backend/admin${path}`, init);
}

async function adminJson<T = any>(path: string, init?: ApiFetchOptions): Promise<T> {
  const res = await adminFetch(path, init);
  return (await res.json()) as T;
}

// ── Dashboard ──

export interface AdminDashboard {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  recentOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  tokens: {
    totalTokensPurchased: number;
    totalTokensUsed: number;
    totalTokensRefunded: number;
  };
}

export const adminApi = {
  getDashboard: () => adminJson<AdminDashboard>("/dashboard"),

  // Users
  listUsers: (params?: { search?: string; role?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.role) qs.set("role", params.role);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return adminJson(`/users${q ? `?${q}` : ""}`);
  },

  getUser: (id: string) => adminJson(`/users/${id}`),

  deleteUser: (id: string) =>
    adminFetch(`/users/${id}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error("Failed to delete user");
    }),

  // Vendors
  listVendors: (params?: { search?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return adminJson(`/vendors${q ? `?${q}` : ""}`);
  },

  toggleVendorVerified: (id: string) =>
    adminJson(`/vendors/${id}/verify`, { method: "PATCH" }),

  // Tokens
  getTokenHistory: (vendorId: string, limit?: number) =>
    adminJson(`/tokens/${vendorId}/history${limit ? `?limit=${limit}` : ""}`),

  resetTokens: (vendorId: string, amount: number, reason: string) =>
    adminJson(`/tokens/${vendorId}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, reason }),
    }),

  creditTokens: (vendorId: string, amount: number, reason: string) =>
    adminJson(`/tokens/${vendorId}/credit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, reason }),
    }),

  // Orders
  listOrders: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return adminJson(`/orders${q ? `?${q}` : ""}`);
  },

  getOrder: (id: string) => adminJson(`/orders/${id}`),
};
