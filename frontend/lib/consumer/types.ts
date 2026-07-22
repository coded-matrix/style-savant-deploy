export type Currency = "GHS" | "NGN";

export type Category =
  | "All"
  | "Fashion"
  | "Tops"
  | "Bottoms"
  | "Dresses"
  | "Shoes"
  | "Accessories"
  | "Art"
  | "Artefacts"
  | "Home Decor";

/** Categories currently supported by the fashion-only consumer experience. */
export const FASHION_CATEGORIES: readonly Category[] = [
  "Fashion",
  "Tops",
  "Bottoms",
  "Dresses",
  "Shoes",
];

export function isFashionCategory(category: Category): boolean {
  return FASHION_CATEGORIES.includes(category);
}

export type OutfitSlot = "Top" | "Bottom" | "Shoes" | "Accessory" | "Outerwear";

export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "One Size" | "Custom";

export interface Product {
  id: string;
  name: string;
  vendorId: string;
  vendorName: string;
  priceGHS: number;
  images: string[];
  /**
   * Cloth-only garment images used only by the AI virtual try-on. Not shown in
   * feed / storefront / product browsing. Index 0 is the cover cloth image.
   */
  clothImages?: string[];
  sizes: Size[];
  colors?: { name: string; hex: string }[];
  category: Category;
  description: string;
  deliveryInfo: string;
  returnPolicy: string;
  artLinkedArtistId?: string;
  soldOut?: boolean;
  stockBySize?: Partial<Record<Size, boolean>>;
  rating: number;
  communityLookIds?: string[];
  /** Vendor-assigned style/aesthetic tags (e.g. "Kente", "Minimalist Noir"). */
  styleTags?: string[];
}

export interface Vendor {
  id: string;
  name: string;
  logo: string;
  cover: string;
  verified: boolean;
  productsCount: number;
  looksCount: number;
  memberSince: string;
  category: Category;
  bio: string;
  /** WhatsApp-first checkout: orders are handed to the business over WhatsApp. */
  businessWhatsapp?: string | null;
  businessCallNumber?: string | null;
}

export interface Artist {
  id: string;
  name: string;
  portrait: string;
  bio: string;
  location: string;
  backdropsCount: number;
  tagline?: string;
  followersCount?: string;
  originalWorks?: { id: string; title: string; priceGHS: number; image: string; medium?: string }[];
}

export interface Backdrop {
  id: string;
  name: string;
  artistId?: string;
  artistName: string;
  image: string;
  premium: boolean;
  priceGHS?: number;
  purchased?: boolean;
}

export interface Look {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  image: string;
  /** Optional timeline video; image is used as its poster and fallback. */
  videoUrl?: string | null;
  caption: string;
  votes: number;
  leadProductId: string;
  productIds: string[];
  backdropId: string;
  createdAt: string; // ISO
  votedByMe?: boolean;
  isMine?: boolean;
}

export interface ArtStyle {
  id: string;
  name: string;
  image: string;
}

export interface PresetModel {
  id: string;
  name: string;
  thumb: string;
}

export interface CartItem {
  id: string; // unique line id
  productId: string;
  size: Size;
  color?: string;
  qty: number;
}

export interface Order {
  id: string;
  number: string;
  items: CartItem[];
  totalGHS: number;
  address: Address;
  paymentMethod: string;
  estimatedDelivery: string;
  hasDigitalBackdrop?: boolean;
}

export interface Address {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  ghanaPostGps?: string;
}

export interface FitProfile {
  photo?: string;
  modelId?: string;
  height?: string;
  weight?: string;
  sizes?: { Top?: Size; Bottom?: Size; Shoes?: string };
}

export interface User {
  username: string;
  avatar: string;
  isGuest: boolean;
  fitProfile?: FitProfile;
  artStyleIds: string[];
  backdropIds: string[];
  email?: string;
  phone?: string;
  looksPosted: number;
  votesReceived: number;
}

export type ToastTone = "neutral" | "error" | "warn" | "success";

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

export type RankFilter = "Today" | "This Week" | "All Time";

export interface GalleryItem {
  id: string;
  productId: string;
  productName: string;
  imageBase64: string;
  createdAt: string;
}
