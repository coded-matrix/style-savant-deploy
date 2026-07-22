import {
  AppNotification,
  Backdrop,
  Campaign,
  Order,
  Product,
  Subscription,
  TokenUsageEntry,
  TopUpHistory,
} from "./types";

export const PLAN_DETAILS: Record<
  string,
  { name: string; price: string; allowance: number; listingCap: number; features: string[] }
> = {
  starter: {
    name: "Starter",
    price: "Free",
    allowance: 500,
    listingCap: 10,
    features: [
      "10 active listings",
      "500 tokens / month",
      "Core AI features",
      "Paystack payouts",
      "Vendor storefront page",
    ],
  },
  growth: {
    name: "Growth",
    price: "GHS 120/mo",
    allowance: 3000,
    listingCap: 100,
    features: [
      "100 active listings",
      "3,000 tokens / month",
      "Full AI suite (Try-On, Polish)",
      "Paystack payouts",
      "Vendor storefront page",
    ],
  },
  pro: {
    name: "Pro",
    price: "GHS 280/mo",
    allowance: 10000,
    listingCap: 500,
    features: [
      "500 active listings",
      "10,000 tokens / month",
      "Priority AI generation",
      "Paystack payouts",
      "Featured storefront placement",
    ],
  },
};

const PRODUCT_SEED: Omit<Product, "id" | "status" | "createdAt">[] = [
  {
    name: "Kente Scarf",
    sku: "KS-001",
    description: "Handwoven Kente accent scarf.",
    price: 180,
    category: "Fashion",
    stock: 24,
    sizes: ["One Size"],
    bespoke: false,
    images: [
      "https://images.unsplash.com/photo-1613876215075-276fd62c89a4?w=1200&q=80",
      "https://images.unsplash.com/photo-1713845784497-fe3d7ed176d8?w=1200&q=80",
    ],
    customSize: "",
  },
  {
    name: "Ankara Wrap Dress",
    sku: "AD-014",
    description: "Vibrant Ankara wrap dress, midi length.",
    price: 320,
    category: "Fashion",
    stock: 12,
    sizes: ["S", "M", "L", "XL"],
    bespoke: false,
    images: [
      "https://images.unsplash.com/photo-1601653233006-5c9fd30eab12?w=1200&q=80",
      "https://images.unsplash.com/photo-1760907949889-eb62b7fd9f75?w=1200&q=80",
    ],
    customSize: "",
  },
  {
    name: "Bespoke Agbada",
    sku: "BA-007",
    description: "Made-to-measure men's Agbada set.",
    price: 850,
    category: "Fashion",
    stock: 4,
    sizes: ["Custom"],
    bespoke: true,
    images: [
      "https://images.unsplash.com/photo-1663044022557-7d5d4c1d5318?w=1200&q=80",
      "https://images.unsplash.com/photo-1663043994777-7ed4b4e6cba3?w=1200&q=80",
    ],
    customSize: "Bespoke — buyer submits measurements",
  },
  {
    name: "Adinkra Print Tote",
    sku: "AT-022",
    description: "Cotton tote with Adinkra motifs.",
    price: 95,
    category: "Accessories",
    stock: 0,
    sizes: ["One Size"],
    bespoke: false,
    images: [
      "https://images.unsplash.com/photo-1756792339487-d044709b27f2?w=1200&q=80",
      "https://images.unsplash.com/photo-1574362098421-38623a3466b5?w=1200&q=80",
    ],
    customSize: "",
  },
  {
    name: "Smock (Tani)",
    sku: "SM-003",
    description: "Traditional Northern smock, hand-stitched.",
    price: 260,
    category: "Fashion",
    stock: 8,
    sizes: ["S", "M", "L"],
    bespoke: false,
    images: [
      "https://images.unsplash.com/photo-1776880471112-708c211e6a4b?w=1200&q=80",
      "https://images.unsplash.com/photo-1687952622898-4e9514a710d5?w=1200&q=80",
    ],
    customSize: "",
  },
  {
    name: "Beaded Necklace Set",
    sku: "BN-011",
    description: "Glass-bead necklace and earring set.",
    price: 140,
    category: "Accessories",
    stock: 30,
    sizes: ["One Size"],
    bespoke: false,
    images: [
      "https://images.unsplash.com/photo-1713845784497-fe3d7ed176d8?w=1200&q=80",
      "https://images.unsplash.com/photo-1613876215075-276fd62c89a4?w=1200&q=80",
    ],
    customSize: "",
  },
  {
    name: "Kente Sneakers",
    sku: "KS-019",
    description: "Canvas sneakers with Kente heel tab.",
    price: 410,
    category: "Fashion",
    stock: 3,
    sizes: ["40", "41", "42", "43", "44"],
    bespoke: false,
    images: [
      "https://images.unsplash.com/photo-1613274146063-8930e164c743?w=1200&q=80",
    ],
    customSize: "",
  },
  {
    name: "Tailored Dashiki",
    sku: "TD-005",
    description: "Slim-fit Dashiki shirt, made-to-measure.",
    price: 290,
    category: "Fashion",
    stock: 6,
    sizes: ["Custom"],
    bespoke: true,
    images: [
      "https://images.unsplash.com/photo-1776880471112-708c211e6a4b?w=1200&q=80",
      "https://images.unsplash.com/photo-1687952622898-4e9514a710d5?w=1200&q=80",
    ],
    customSize: "Bespoke — chest/waist/hips",
  },
  {
    name: "Raffia Wall Art",
    sku: "RW-002",
    description: "Hand-woven raffia wall hanging.",
    price: 220,
    category: "Home Decor",
    stock: 15,
    sizes: ["One Size"],
    bespoke: false,
    images: [
      "https://images.unsplash.com/photo-1621419203897-20b66b98d495?w=1200&q=80",
    ],
    customSize: "",
  },
  {
    name: "Studio Backdrop — Accra",
    sku: "SB-001",
    description: "Urban skyline backdrop for try-on.",
    price: 0,
    category: "Backdrops",
    stock: 999,
    sizes: ["One Size"],
    bespoke: false,
    images: [
      "https://images.unsplash.com/photo-1772033596355-4d39c555fbd9?w=800&q=80",
    ],
    customSize: "",
  },
  {
    name: "Festival Headwrap",
    sku: "FH-008",
    description: "Gele-style festival headwrap.",
    price: 110,
    category: "Accessories",
    stock: 18,
    sizes: ["One Size"],
    bespoke: false,
    images: [
      "https://images.unsplash.com/photo-1666974932375-90e8a25bc1ef?w=1200&q=80",
      "https://images.unsplash.com/photo-1757140448921-f120d58546dc?w=1200&q=80",
    ],
    customSize: "",
  },
  {
    name: "Bespoke Kaftan",
    sku: "BK-004",
    description: "Flowing silk kaftan, custom measurements.",
    price: 540,
    category: "Fashion",
    stock: 2,
    sizes: ["Custom"],
    bespoke: true,
    images: [
      "https://images.unsplash.com/photo-1775036760841-6c1854634646?w=1200&q=80",
      "https://images.unsplash.com/photo-1696962678565-bee84e6b9cb6?w=1200&q=80",
    ],
    customSize: "Bespoke — full body scan",
  },
  {
    name: "Wax Print Cushion",
    sku: "WC-013",
    description: "Wax-print cushion cover, 45x45cm.",
    price: 75,
    category: "Home Decor",
    stock: 22,
    sizes: ["One Size"],
    bespoke: false,
    images: [
      "https://images.unsplash.com/photo-1756792339487-d044709b27f2?w=1200&q=80",
    ],
    customSize: "",
  },
  {
    name: "Leather Sandals",
    sku: "LS-017",
    description: "Hand-cut leather slide sandals.",
    price: 160,
    category: "Accessories",
    stock: 9,
    sizes: ["39", "40", "41", "42", "43"],
    bespoke: false,
    images: [
      "https://images.unsplash.com/photo-1757140448921-f120d58546dc?w=1200&q=80",
    ],
    customSize: "",
  },
];

export function seedProducts(): Product[] {
  const statusFor = (p: Omit<Product, "id" | "status" | "createdAt">): Product["status"] => {
    if (p.stock === 0) return "sold_out";
    return "active";
  };
  const statuses: Product["status"][] = ["active", "active", "active", "sold_out", "active", "active", "active", "draft", "active", "active", "active", "active", "active", "active"];
  return PRODUCT_SEED.map((p, i) => ({
    ...p,
    id: `prod-${i + 1}`,
    status: i === 7 ? "draft" : p.stock === 0 ? "sold_out" : "active",
    createdAt: new Date(Date.now() - (14 - i) * 86400000).toISOString(),
  }));
}

export function seedOrders(): Order[] {
  const base = Date.now();
  return [
    {
      id: "SS-1042", customer: "Ama Mensah", phone: "+233 24 111 2233", address: "12 Oxford St, Osu, Accra", gps: "GA-123-4567", date: new Date(base - 2 * 86400000).toISOString(), total: 640, status: "pending", bespoke: true,
      measurements: { chest: 37.8, waist: 30.71, hips: 40.16, height: 63.78, shoulderWidth: 15.75, sleeveLength: 22.83, note: "Shorten hem by 4cm" },
      items: [{ productId: "prod-2", name: "Ankara Wrap Dress", size: "M", color: "Indigo", qty: 1, price: 320 }, { productId: "prod-11", name: "Festival Headwrap", size: "One Size", color: "Gold", qty: 1, price: 110 }, { productId: "prod-3", name: "Bespoke Agbada", size: "Custom", color: "Green", qty: 1, price: 210 }],
    },
    {
      id: "SS-1041", customer: "Kwame Osei", phone: "+233 20 444 5566", address: "5 Ringway Est, Accra", gps: "GA-987-6543", date: new Date(base - 3 * 86400000).toISOString(), total: 410, status: "shipped", tracking: "EA123456789GH", courier: "Ghana Post EMS",
      items: [{ productId: "prod-7", name: "Kente Sneakers", size: "42", color: "Teal", qty: 1, price: 410 }],
    },
    {
      id: "SS-1040", customer: "Grace Addo", phone: "+233 27 777 8899", address: "33 Labone Ave, Accra", date: new Date(base - 5 * 86400000).toISOString(), total: 540, status: "delivered", tracking: "EA987654321GH", courier: "Ghana Post EMS",
      items: [{ productId: "prod-12", name: "Bespoke Kaftan", size: "Custom", color: "Burgundy", qty: 1, price: 540 }],
      bespoke: true, measurements: { chest: 40.16, waist: 33.07, hips: 43.31, height: 66.93, shoulderWidth: 16.54, sleeveLength: 23.62, note: "" },
    },
    {
      id: "SS-1039", customer: "Yaw Boateng", phone: "+233 23 222 3344", address: "8 Tema Comm 4, Tema", date: new Date(base - 6 * 86400000).toISOString(), total: 260, status: "confirmed",
      items: [{ productId: "prod-5", name: "Smock (Tani)", size: "L", color: "Natural", qty: 1, price: 260 }],
    },
    {
      id: "SS-1038", customer: "Efua Danso", phone: "+233 26 555 6677", address: "21 East Legon, Accra", date: new Date(base - 9 * 86400000).toISOString(), total: 215, status: "delivered",
      items: [{ productId: "prod-6", name: "Beaded Necklace Set", size: "One Size", color: "Multi", qty: 1, price: 140 }, { productId: "prod-13", name: "Wax Print Cushion", size: "One Size", color: "Red", qty: 1, price: 75 }],
    },
    {
      id: "SS-1037", customer: "Kojo Mensah", phone: "+233 24 888 9900", address: "14 Kasoa, Central Region", date: new Date(base - 12 * 86400000).toISOString(), total: 320, status: "cancelled",
      items: [{ productId: "prod-2", name: "Ankara Wrap Dress", size: "L", color: "Indigo", qty: 1, price: 320 }],
    },
  ];
}

export function seedNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    { id: "n1", category: "orders", text: "New order #SS-1042 from Ama Mensah — bespoke, needs measurements review.", time: "2h ago", read: false, link: "/vendor/orders/SS-1042" },
    { id: "n2", category: "stock", text: "Adinkra Print Tote (AT-022) is SOLD OUT.", time: "5h ago", read: false, link: "/vendor/inventory" },
    { id: "n3", category: "stock", text: "Low stock: Kente Sneakers (KS-019) has 3 left.", time: "1d ago", read: false, link: "/vendor/inventory" },
    { id: "n4", category: "tokens", text: "Your token balance is below 200. Top up to keep using AI features.", time: "1d ago", read: true, link: "/vendor/tokens" },
    { id: "n5", category: "payouts", text: "Payout of GHS 1,240 processed to your bank.", time: "2d ago", read: true, link: "/vendor/payouts" },
    { id: "n6", category: "system", text: "Storefront approved. Your page is now live.", time: "3d ago", read: true },
  ];
}

export function seedSubscription(): Subscription {
  return {
    tier: "growth",
    renewalDate: new Date(Date.now() + 18 * 86400000).toISOString(),
    listingCap: 100,
    tokenAllowance: 3000,
    tokensUsed: 120,
  };
}

export function seedTokenUsage(): TokenUsageEntry[] {
  return [
    { feature: "Campaign Creation", calls: 2, tokens: 160 },
    { feature: "Virtual Try-On", calls: 3, tokens: 60 },
    { feature: "AI Image Polish", calls: 4, tokens: 40 },
    { feature: "Smart Measurements", calls: 6, tokens: 0 },
  ];
}

export function seedTopUpHistory(): TopUpHistory[] {
  return [
    { date: new Date(Date.now() - 20 * 86400000).toISOString(), tokens: 1000, ghs: 75 },
    { date: new Date(Date.now() - 40 * 86400000).toISOString(), tokens: 5000, ghs: 350 },
  ];
}

export function seedCampaigns(): Campaign[] {
  return [
    {
      id: "cmp-1",
      title: "Celebrate in Kente Accent Scarf — Summer Collection",
      caption: "Experience handwoven elegance with our Kente Scarf. Crafted with care in Ghana, styled for the modern trendsetter.",
      hashtags: ["#StyleSavant", "#Kente", "#SummerFits", "#AccraStyle"],
      image: "https://images.unsplash.com/photo-1687052093309-7a14efa58ecb?w=800&q=80",
      products: ["prod-1"],
      prompt: "Create a summer social campaign focusing on heritage weaving.",
      market: "Domestic",
      format: "Instagram Post",
      tokens: 80,
      date: new Date(Date.now() - 1 * 86400000).toISOString(),
    }
  ];
}

export function seedBackdrops(): Backdrop[] {
  return [
    { id: "bd-1", title: "Accra Skyline", description: "Urban dusk skyline for streetwear.", keywords: ["urban", "accra", "dusk"], category: "Urban", image: "https://images.unsplash.com/photo-1772033596355-4d39c555fbd9?w=800&q=80" },
    { id: "bd-2", title: "Studio White", description: "Clean studio white for product focus.", keywords: ["studio", "minimal"], category: "Studio", image: "https://images.unsplash.com/photo-1781791430158-270e199e21a7?w=800&q=80" },
    { id: "bd-3", title: "Clay Wall", description: "Rustic clay background.", keywords: ["clay", "earthy"], category: "Rustic", image: "https://images.unsplash.com/photo-1765706727592-e9309fbb210a?w=800&q=80" },
  ];
}

export const DEFAULT_STOREFRONT = {
  cover: "https://images.unsplash.com/photo-1769349661389-0737f39a8507?w=1200&q=80",
  logo: "https://images.unsplash.com/photo-1613876215075-276fd62c89a4?w=200&q=80",
  businessName: "Maison d'Afrik",
  bio: "Contemporary West African atelier fusing tailoring heritage with streetwear ease.",
  tags: ["Ankara", "Bespoke", "Accessories"],
  instagram: "stylesavant_gh",
  tiktok: "stylesavant",
  website: "stylesavant.com",
  shippingPolicy:
    "Orders ship within 3–5 business days. Bespoke items take 10–14 days. Returns accepted within 14 days for unworn items.",
};
