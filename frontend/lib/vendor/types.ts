export type ProductStatus = "active" | "draft" | "sold_out" | "archived";

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sizes: string[];
  customSize?: string;
  bespoke: boolean;
  images: string[];
  /**
   * Cloth-only (garment laid flat / on hanger) versions of `images`, in the
   * same order. Used exclusively by the AI virtual try-on ("Agnes"); never
   * shown to consumers in browsing. May be shorter than `images`.
   */
  clothImages?: string[];
  /** Style/aesthetic tags shown to shoppers for filtering (e.g. "Kente"). */
  styleTags?: string[];
  status: ProductStatus;
  createdAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  color: string;
  qty: number;
  price: number;
}

export interface Measurements {
  chest?: number | null;
  bust?: number | null;
  underbust?: number | null;
  shoulderWidth?: number | null;
  neck?: number | null;
  sleeveLength?: number | null;
  bicep?: number | null;
  wrist?: number | null;
  backLength?: number | null;
  waist?: number | null;
  hips?: number | null;
  thigh?: number | null;
  knee?: number | null;
  calf?: number | null;
  inseam?: number | null;
  outseam?: number | null;
  height?: number | null;
  note?: string;
}

export interface Order {
  id: string;
  customer: string;
  phone: string;
  address: string;
  gps?: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  tracking?: string;
  courier?: string;
  bespoke?: boolean;
  measurements?: Measurements;
}

export type CampaignFormat = "Instagram Post" | "Story" | "Carousel";
export type CampaignMarket = "Domestic" | "Diaspora" | "International";

export interface Campaign {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  /** One-line punchy ad text (from AI copy generation). */
  adText?: string;
  image: string;
  products: string[];
  prompt: string;
  market: CampaignMarket;
  format: CampaignFormat;
  tokens: number;
  date: string;
  /** Public campaign page returned by the shared merchant API. */
  shareUrl?: string;
}

export type NotificationCategory =
  | "orders"
  | "stock"
  | "tokens"
  | "payouts"
  | "system";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  text: string;
  time: string;
  read: boolean;
  link?: string;
}

export type SubscriptionTier = "starter" | "growth" | "pro";

export interface Subscription {
  tier: SubscriptionTier;
  renewalDate: string;
  listingCap: number;
  tokenAllowance: number;
  tokensUsed: number;
}

export interface Backdrop {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  image: string;
}

export interface StorefrontSettings {
  cover: string;
  logo: string;
  businessName: string;
  bio: string;
  tags: string[];
  instagram: string;
  tiktok: string;
  website: string;
  shippingPolicy: string;
}

export interface TokenUsageEntry {
  feature: string;
  calls: number;
  tokens: number;
}

export interface TopUpHistory {
  date: string;
  tokens: number;
  ghs: number;
}
