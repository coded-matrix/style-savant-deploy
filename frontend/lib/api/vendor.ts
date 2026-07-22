import { apiJson, apiFetch } from "./client";
import { getVendorToken } from "./token";
import {
  Order,
  OrderItem,
  Product,
  Campaign,
  CampaignFormat,
  CampaignMarket,
  StorefrontSettings,
  AppNotification,
  NotificationCategory,
  Measurements,
} from "@/lib/vendor/types";

/* ------------------------------------------------------------------ */
/*  Raw backend shapes — typed interfaces for the Drizzle/Postgres    */
/*  response payloads before they pass through the mapper layer.      */
/* ------------------------------------------------------------------ */

interface RawProduct {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  category: string;
  stock?: number;
  sizes?: string[];
  requiresMeasurements?: boolean;
  bespoke?: boolean;
  images?: string[];
  clothImages?: string[];
  styleTags?: string[];
  status?: string;
  published?: boolean;
  soldOut?: boolean;
  createdAt?: string | Date;
}

interface RawOrderItem {
  productId: string;
  name?: string;
  size?: string;
  color?: string;
  qty?: number;
  quantity?: number;
  price: number;
}

interface RawShippingAddress {
  name?: string;
  phone?: string;
  line1?: string;
  city?: string;
  region?: string;
  ghanaPostGps?: string;
}

interface RawOrder {
  id: string;
  customer?: string;
  customerName?: string;
  phone?: string;
  customerPhone?: string;
  address?: string;
  gps?: string;
  date?: string;
  totalAmount?: number;
  total?: number;
  status?: string;
  items?: RawOrderItem[];
  tracking?: string;
  courier?: string;
  paymentReference?: string;
  shippingAddress?: RawShippingAddress;
  bespoke?: boolean;
  measurements?: Measurements;
  createdAt?: string | Date;
}

interface RawCampaign {
  id: string;
  title: string;
  caption: string;
  hashtags?: string[];
  image?: string;
  products?: string[];
  prompt?: string;
  market?: string;
  format?: string;
  tokens?: number;
  date?: string;
  createdAt?: string | Date;
}

interface RawStorefront {
  businessName?: string;
  logo?: string;
  cover?: string;
  bio?: string;
  description?: string;
  tags?: string[];
  instagram?: string;
  tiktok?: string;
  website?: string;
  shippingPolicy?: string;
}

interface RawNotification {
  id: string;
  category: string;
  text: string;
  link?: string | null;
  read: boolean;
  createdAt?: string | Date;
}

/* ------------------------------------------------------------------ */
/*  Data mappers — transform backend (Drizzle/Postgres) shapes into   */
/*  the frontend types defined in lib/vendor/types.ts                 */
/* ------------------------------------------------------------------ */

/** Turn an ISO timestamp into a compact relative label ("2h ago"). */
function relativeTime(input: string | Date | undefined): string {
  if (!input) return "";
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return day === 1 ? "yesterday" : `${day}d ago`;
}

const VALID_NOTIF_CATEGORIES: NotificationCategory[] = ["orders", "stock", "tokens", "payouts", "system"];

function mapNotification(raw: RawNotification): AppNotification {
  const category = (VALID_NOTIF_CATEGORIES.includes(raw.category as NotificationCategory)
    ? raw.category
    : "system") as NotificationCategory;
  return {
    id: raw.id,
    category,
    text: raw.text,
    time: relativeTime(raw.createdAt),
    read: raw.read,
    link: raw.link ?? undefined,
  };
}

function mapProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    sku: raw.sku || `SK-${String(raw.id).slice(0, 8).toUpperCase()}`,
    description: raw.description || "",
    price: Number(raw.price),
    category: raw.category,
    stock: raw.stock ?? 0,
    sizes: raw.sizes || [],
    bespoke: raw.requiresMeasurements ?? raw.bespoke ?? false,
    images: raw.images || [],
    clothImages: raw.clothImages || [],
    styleTags: raw.styleTags || [],
    status: (raw.status
      ? raw.status
      : !raw.published
        ? "draft"
        : raw.soldOut || raw.stock === 0
          ? "sold_out"
          : "active") as Product["status"],
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : raw.createdAt instanceof Date
          ? raw.createdAt.toISOString()
          : new Date().toISOString(),
  };
}

/**
 * Parse tracking data that the backend stores inside
 * `orders.paymentReference` as JSON.
 */
function parseTracking(
  paymentReference: string | null | undefined,
): { trackingNumber: string; courierName: string } | null {
  if (!paymentReference) return null;
  try {
    const parsed = JSON.parse(paymentReference);
    if (parsed.trackingNumber) return parsed;
  } catch {
    // Not JSON — it's a plain payment ref string
  }
  return null;
}

function mapOrderItem(raw: RawOrderItem): OrderItem {
  return {
    productId: raw.productId,
    name: raw.name || "Product",
    size: raw.size || "",
    color: raw.color || "",
    qty: raw.qty ?? raw.quantity ?? 1,
    price: Number(raw.price),
  };
}

function mapOrder(raw: RawOrder): Order {
  const addr = raw.shippingAddress;
  const tracking = parseTracking(raw.paymentReference);

  const VALID_STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];
  const status = (VALID_STATUSES.includes(raw.status || "") ? raw.status : "pending") as Order["status"];

  return {
    id: raw.id,
    customer:
      raw.customer || raw.customerName || addr?.name || "Unknown",
    phone:
      raw.phone || raw.customerPhone || addr?.phone || "",
    address:
      raw.address ||
      (addr
        ? [addr.line1, addr.city, addr.region].filter(Boolean).join(", ")
        : ""),
    gps: raw.gps || addr?.ghanaPostGps,
    date:
      raw.date ||
      (typeof raw.createdAt === "string"
        ? raw.createdAt
        : raw.createdAt instanceof Date
          ? raw.createdAt.toISOString()
          : new Date().toISOString()),
    total: Number(raw.totalAmount ?? raw.total ?? 0),
    status,
    items: (raw.items || []).map(mapOrderItem),
    tracking: raw.tracking || tracking?.trackingNumber,
    courier: raw.courier || tracking?.courierName,
    bespoke: raw.bespoke ?? false,
    measurements: raw.measurements,
  };
}

function mapCampaign(raw: RawCampaign): Campaign {
  return {
    id: raw.id,
    title: raw.title,
    caption: raw.caption,
    hashtags: raw.hashtags || [],
    image: raw.image || "",
    products: raw.products || [],
    prompt: raw.prompt || "",
    market: (raw.market || "Domestic") as CampaignMarket,
    format: (raw.format || "Instagram Post") as CampaignFormat,
    tokens: raw.tokens ?? 0,
    date:
      raw.date ||
      (typeof raw.createdAt === "string"
        ? raw.createdAt
        : raw.createdAt instanceof Date
          ? raw.createdAt.toISOString()
          : new Date().toISOString()),
  };
}

/* ------------------------------------------------------------------ */
/*  Public API interfaces                                              */
/* ------------------------------------------------------------------ */

export interface VendorDashboardData {
  businessName: string;
  logo: string | null;
  verified: boolean;
  activeListings: number;
  pendingOrders: number;
  totalSales: number;
  netEarnings: number;
  tokenBalance: {
    vendorId: string;
    tokensTotal: number;
    tokensUsed: number;
    tokensRemaining: number;
    status: "active" | "expired" | "cancelled";
    lowBalanceAlert: boolean;
  };
}

export interface PayoutData {
  netEarnings: number;
  totalSales: number;
  availablePayout: number;
  bankConnected: boolean;
  bankName: string;
  accountNumber: string;
}

/* ------------------------------------------------------------------ */
/*  Vendor API client with mapper layer                                */
/* ------------------------------------------------------------------ */

export const vendorApi = {
  async getDashboard(): Promise<VendorDashboardData> {
    return apiJson<VendorDashboardData>("/api/backend/vendor/dashboard");
  },

  async getStorefront(): Promise<StorefrontSettings> {
    // Backend returns the full vendors row; map to StorefrontSettings.
        const raw = await apiJson<RawStorefront>("/api/backend/vendor/storefront");
    return {
      businessName: raw.businessName || "",
      logo: raw.logo || "",
      cover: raw.cover || "",
      bio: raw.bio || raw.description || "",
      tags: raw.tags || [],
      instagram: raw.instagram || "",
      tiktok: raw.tiktok || "",
      website: raw.website || "",
      shippingPolicy: raw.shippingPolicy || "",
    };
  },

  async updateStorefront(patch: Partial<StorefrontSettings>): Promise<StorefrontSettings> {
        const raw = await apiJson<RawStorefront>("/api/backend/vendor/storefront", {
      method: "PATCH",
      body: patch,
    });
    return {
      businessName: raw.businessName || "",
      logo: raw.logo || "",
      cover: raw.cover || "",
      bio: raw.bio || raw.description || "",
      tags: raw.tags || [],
      instagram: raw.instagram || "",
      tiktok: raw.tiktok || "",
      website: raw.website || "",
      shippingPolicy: raw.shippingPolicy || "",
    };
  },

  async getOrders(): Promise<Order[]> {
        const raw = await apiJson<RawOrder[]>("/api/backend/vendor/orders");
    return raw.map(mapOrder);
  },

  async getOrderById(id: string): Promise<Order> {
        const raw = await apiJson<RawOrder>(`/api/backend/vendor/orders/${id}`);
    return mapOrder(raw);
  },

  async updateOrderStatus(id: string, status: Order["status"]): Promise<Order> {
        const raw = await apiJson<RawOrder>(`/api/backend/vendor/orders/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    return mapOrder(raw);
  },

  async updateOrderTracking(
    id: string,
    trackingNumber: string,
    courierName: string,
  ): Promise<Order> {
        const raw = await apiJson<RawOrder>(`/api/backend/vendor/orders/${id}/tracking`, {
      method: "PATCH",
      body: { trackingNumber, courierName },
    });
    return mapOrder(raw);
  },

  async getTokensBalance(): Promise<VendorDashboardData["tokenBalance"]> {
    return apiJson<VendorDashboardData["tokenBalance"]>("/api/backend/vendor/tokens/balance");
  },

  async buyTokens(amount: number, reference: string): Promise<{ success: boolean; tokensRemaining: number }> {
    return apiJson<{ success: boolean; tokensRemaining: number }>("/api/backend/vendor/tokens/buy", {
      method: "POST",
      body: { amount, reference },
    });
  },

  async getCampaigns(): Promise<Campaign[]> {
        const raw = await apiJson<RawCampaign[]>("/api/backend/vendor/campaigns");
    return raw.map(mapCampaign);
  },

  async createCampaign(meta: {
    title: string;
    prompt: string;
    products: string[];
    market: string;
    format: string;
  }): Promise<Campaign> {
        const raw = await apiJson<RawCampaign>("/api/backend/vendor/campaigns", {
      method: "POST",
      body: meta,
    });
    return mapCampaign(raw);
  },

  /**
   * Agnes/Gemini-powered marketing copy from a product image + brief + audience.
   * audience is one of "domestic" | "diaspora" | "international".
   */
  async generateCampaignCopy(
    product: File,
    prompt: string,
    audience: string,
    headline?: string,
  ): Promise<{ caption: string; hashtags: string[]; ad_text: string }> {
    const fd = new FormData();
    fd.append("product", product);
    fd.append("prompt", prompt);
    fd.append("audience", audience);
    if (headline) fd.append("headline", headline);
    return apiJson("/api/backend/campaign/text", { method: "POST", body: fd });
  },

  /** Agnes-generated campaign image (returns raw base64, no data-URI prefix). */
  async generateCampaignImage(
    product: File,
    prompt: string,
    audience: string,
    headline?: string,
    format?: string,
  ): Promise<{ image: string }> {
    const fd = new FormData();
    fd.append("product", product);
    fd.append("prompt", prompt);
    fd.append("audience", audience);
    if (headline) fd.append("headline", headline);
    if (format) fd.append("format", format);
    return apiJson("/api/backend/campaign/image", { method: "POST", body: fd });
  },

  async publishCampaign(input: {
    title: string;
    copyText: string;
    imageBase64: string;
    featuredItems: Array<{ id: string; name: string }>;
  }): Promise<{
    id: string;
    shareUrl: string;
    imageUrl: string;
    campaign: Record<string, unknown>;
  }> {
    return apiJson("/api/backend/campaign/publish", {
      method: "POST",
      body: input,
    });
  },

  /**
   * Generate a shopper-facing display image (a model wearing the garment) from
   * a cloth-only photo via Agnes. `brief` is composed from the UI style Q&A.
   * Returns raw base64 (no data-URI prefix).
   */
  async generateModelImage(cloth: File, brief: string): Promise<{ image: string }> {
    const fd = new FormData();
    fd.append("cloth", cloth);
    if (brief) fd.append("brief", brief);
    return apiJson("/api/backend/inventory/generate-model", { method: "POST", body: fd });
  },

  async getPayouts(): Promise<PayoutData> {
    return apiJson<PayoutData>("/api/backend/vendor/payouts");
  },

  async getNotifications(): Promise<AppNotification[]> {
    const raw = await apiJson<RawNotification[]>("/api/backend/vendor/notifications");
    return raw.map(mapNotification);
  },

  async markNotificationsRead(): Promise<void> {
    await apiFetch("/api/backend/vendor/notifications/read-all", {
      method: "PATCH",
    });
  },

  async getProducts(): Promise<Product[]> {
        const raw = await apiJson<RawProduct[]>("/api/backend/inventory");
    return raw.map(mapProduct);
  },

  async addProduct(formData: FormData): Promise<Product> {
        const raw = await apiJson<RawProduct>("/api/backend/inventory", {
      method: "POST",
      body: formData,
    });
    return mapProduct(raw);
  },

  async updateProduct(id: string, patch: Partial<Product>): Promise<Product> {
        const raw = await apiJson<RawProduct>(`/api/backend/inventory/${id}`, {
      method: "PATCH",
      body: patch,
    });
    return mapProduct(raw);
  },

  async updateProductStock(id: string, stock: number): Promise<Product> {
        const raw = await apiJson<RawProduct>(`/api/backend/inventory/${id}/stock`, {
      method: "PATCH",
      body: { stock },
    });
    return mapProduct(raw);
  },

  async deleteProduct(id: string): Promise<void> {
    await apiFetch(`/api/backend/inventory/${id}`, {
      method: "DELETE",
    });
  },
};

/** Check whether we have an auth token (used for optimistic write decisions). */
export function hasAuthToken(): boolean {
  return !!getVendorToken();
}
