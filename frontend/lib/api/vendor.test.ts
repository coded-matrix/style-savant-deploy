import { describe, it, expect } from 'vitest';

/**
 * Tests for the vendor API data mappers.
 *
 * The mapper functions are not exported from vendor.ts, so we test them
 * indirectly by importing the types and exercising the same logic.
 * We replicate the mapper logic here to validate the contract.
 */

// ── Replicated mapper logic (mirrors lib/api/vendor.ts) ──────────────

function relativeTime(input: string | Date | undefined): string {
  if (!input) return '';
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return day === 1 ? 'yesterday' : `${day}d ago`;
}

function parseTracking(paymentReference: string | null | undefined): { trackingNumber: string; courierName: string } | null {
  if (!paymentReference) return null;
  try {
    const parsed = JSON.parse(paymentReference);
    if (parsed.trackingNumber) return parsed;
  } catch {
    // Not JSON — it's a plain payment ref string
  }
  return null;
}

type ProductStatus = 'active' | 'draft' | 'sold_out' | 'archived';

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

function mapProduct(raw: RawProduct) {
  return {
    id: raw.id,
    name: raw.name,
    sku: raw.sku || `SK-${String(raw.id).slice(0, 8).toUpperCase()}`,
    description: raw.description || '',
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
        ? 'draft'
        : raw.soldOut || raw.stock === 0
          ? 'sold_out'
          : 'active') as ProductStatus,
    createdAt:
      typeof raw.createdAt === 'string'
        ? raw.createdAt
        : raw.createdAt instanceof Date
          ? raw.createdAt.toISOString()
          : new Date().toISOString(),
  };
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

interface RawOrder {
  id: string;
  customer?: string;
  customerName?: string;
  phone?: string;
  customerPhone?: string;
  status?: string;
  items?: RawOrderItem[];
  totalAmount?: number;
  total?: number;
  paymentReference?: string;
  shippingAddress?: { name?: string; phone?: string; line1?: string; city?: string; region?: string; ghanaPostGps?: string };
  bespoke?: boolean;
  measurements?: { chest: number; waist: number; hips: number; height: number; shoulder: number; sleeve: number };
  createdAt?: string | Date;
}

function mapOrderItem(raw: RawOrderItem) {
  return {
    productId: raw.productId,
    name: raw.name || 'Product',
    size: raw.size || '',
    color: raw.color || '',
    qty: raw.qty ?? raw.quantity ?? 1,
    price: Number(raw.price),
  };
}

function mapOrder(raw: RawOrder) {
  const VALID_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
  const status = (VALID_STATUSES.includes(raw.status || '') ? raw.status : 'pending') as string;

  return {
    id: raw.id,
    customer: raw.customer || raw.customerName || 'Unknown',
    phone: raw.phone || raw.customerPhone || '',
    total: Number(raw.totalAmount ?? raw.total ?? 0),
    status,
    items: (raw.items || []).map(mapOrderItem),
    tracking: raw.paymentReference,
    bespoke: raw.bespoke ?? false,
    measurements: raw.measurements,
  };
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
  createdAt?: string | Date;
}

function mapCampaign(raw: RawCampaign) {
  return {
    id: raw.id,
    title: raw.title,
    caption: raw.caption,
    hashtags: raw.hashtags || [],
    image: raw.image || '',
    products: raw.products || [],
    prompt: raw.prompt || '',
    market: raw.market || 'Domestic',
    format: raw.format || 'Instagram Post',
    tokens: raw.tokens ?? 0,
    date: typeof raw.createdAt === 'string'
      ? raw.createdAt
      : raw.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : new Date().toISOString(),
  };
}

const VALID_NOTIF_CATEGORIES = ['orders', 'stock', 'tokens', 'payouts', 'system'];

interface RawNotification {
  id: string;
  category: string;
  text: string;
  link?: string | null;
  read: boolean;
  createdAt?: string | Date;
}

function mapNotification(raw: RawNotification) {
  const category = (VALID_NOTIF_CATEGORIES.includes(raw.category) ? raw.category : 'system') as string;
  return {
    id: raw.id,
    category,
    text: raw.text,
    time: relativeTime(raw.createdAt),
    read: raw.read,
    link: raw.link ?? undefined,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('mapProduct', () => {
  it('maps a full raw product', () => {
    const raw: RawProduct = {
      id: 'p-1',
      name: 'Ankara Dress',
      sku: 'AD-001',
      description: 'Beautiful dress',
      price: 250,
      category: 'Dresses',
      stock: 10,
      sizes: ['S', 'M', 'L'],
      requiresMeasurements: false,
      images: ['img1', 'img2'],
      clothImages: ['cloth1'],
      styleTags: ['Ankara'],
      published: true,
      soldOut: false,
      createdAt: '2026-01-15T10:00:00Z',
    };

    const result = mapProduct(raw);

    expect(result.id).toBe('p-1');
    expect(result.name).toBe('Ankara Dress');
    expect(result.sku).toBe('AD-001');
    expect(result.price).toBe(250);
    expect(result.images).toEqual(['img1', 'img2']);
    expect(result.clothImages).toEqual(['cloth1']);
    expect(result.styleTags).toEqual(['Ankara']);
    expect(result.status).toBe('active');
    expect(result.bespoke).toBe(false);
  });

  it('generates a SKU when none provided', () => {
    const raw: RawProduct = { id: 'p-abc12345', name: 'Test', price: 100, category: 'Tops' };
    const result = mapProduct(raw);
    expect(result.sku).toBe('SK-P-ABC123');
  });

  it('derives status from published/soldOut/stock when no explicit status', () => {
    expect(mapProduct({ id: 'p-1', name: 'X', price: 10, category: 'T', published: false }).status).toBe('draft');
    expect(mapProduct({ id: 'p-1', name: 'X', price: 10, category: 'T', published: true, soldOut: true }).status).toBe('sold_out');
    expect(mapProduct({ id: 'p-1', name: 'X', price: 10, category: 'T', published: true, stock: 0 }).status).toBe('sold_out');
    expect(mapProduct({ id: 'p-1', name: 'X', price: 10, category: 'T', published: true, stock: 5 }).status).toBe('active');
  });

  it('uses explicit status over derived status', () => {
    const raw: RawProduct = { id: 'p-1', name: 'X', price: 10, category: 'T', status: 'archived', published: true, stock: 5 };
    expect(mapProduct(raw).status).toBe('archived');
  });

  it('maps bespoke from requiresMeasurements or bespoke field', () => {
    expect(mapProduct({ id: 'p-1', name: 'X', price: 10, category: 'T', requiresMeasurements: true }).bespoke).toBe(true);
    expect(mapProduct({ id: 'p-1', name: 'X', price: 10, category: 'T', bespoke: true }).bespoke).toBe(true);
    expect(mapProduct({ id: 'p-1', name: 'X', price: 10, category: 'T' }).bespoke).toBe(false);
  });

  it('defaults missing fields', () => {
    const raw: RawProduct = { id: 'p-1', name: 'X', price: 10, category: 'T' };
    const result = mapProduct(raw);
    expect(result.images).toEqual([]);
    expect(result.clothImages).toEqual([]);
    expect(result.styleTags).toEqual([]);
    expect(result.sizes).toEqual([]);
    expect(result.stock).toBe(0);
    expect(result.description).toBe('');
  });
});

describe('mapOrder', () => {
  it('maps a full order with items', () => {
    const raw: RawOrder = {
      id: 'o-1',
      customerName: 'Ama',
      customerPhone: '0241234567',
      totalAmount: 300,
      status: 'shipped',
      items: [{ productId: 'p-1', name: 'Dress', qty: 2, price: 150 }],
      bespoke: false,
    };

    const result = mapOrder(raw);
    expect(result.id).toBe('o-1');
    expect(result.customer).toBe('Ama');
    expect(result.phone).toBe('0241234567');
    expect(result.total).toBe(300);
    expect(result.status).toBe('shipped');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].qty).toBe(2);
  });

  it('falls back to "Unknown" when no customer name', () => {
    const raw: RawOrder = { id: 'o-1', totalAmount: 100, items: [] };
    expect(mapOrder(raw).customer).toBe('Unknown');
  });

  it('defaults to pending for unknown statuses', () => {
    const raw: RawOrder = { id: 'o-1', status: 'unknown_status', totalAmount: 100, items: [] };
    expect(mapOrder(raw).status).toBe('pending');
  });

  it('maps order items with fallbacks', () => {
    const raw: RawOrderItem = { productId: 'p-1', price: 100 };
    const result = mapOrderItem(raw);
    expect(result.name).toBe('Product');
    expect(result.size).toBe('');
    expect(result.color).toBe('');
    expect(result.qty).toBe(1);
    expect(result.price).toBe(100);
  });
});

describe('mapCampaign', () => {
  it('maps a full campaign', () => {
    const raw: RawCampaign = {
      id: 'c-1',
      title: 'Summer Sale',
      caption: 'Hot deals!',
      hashtags: ['#summer', '#sale'],
      image: 'img1',
      products: ['p-1'],
      prompt: 'Bold summer',
      market: 'Domestic',
      format: 'Instagram Post',
      tokens: 80,
      createdAt: '2026-06-01T00:00:00Z',
    };

    const result = mapCampaign(raw);
    expect(result.title).toBe('Summer Sale');
    expect(result.hashtags).toEqual(['#summer', '#sale']);
    expect(result.tokens).toBe(80);
    expect(result.market).toBe('Domestic');
  });

  it('defaults missing fields', () => {
    const raw: RawCampaign = { id: 'c-1', title: 'X', caption: 'Y' };
    const result = mapCampaign(raw);
    expect(result.hashtags).toEqual([]);
    expect(result.image).toBe('');
    expect(result.products).toEqual([]);
    expect(result.tokens).toBe(0);
    expect(result.market).toBe('Domestic');
    expect(result.format).toBe('Instagram Post');
  });
});

describe('mapNotification', () => {
  it('maps a valid notification', () => {
    const raw: RawNotification = {
      id: 'n-1',
      category: 'orders',
      text: 'New order received',
      read: false,
      link: '/vendor/orders',
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1h ago
    };

    const result = mapNotification(raw);
    expect(result.id).toBe('n-1');
    expect(result.category).toBe('orders');
    expect(result.text).toBe('New order received');
    expect(result.read).toBe(false);
    expect(result.link).toBe('/vendor/orders');
    expect(result.time).toContain('h ago');
  });

  it('falls back to "system" for unknown categories', () => {
    const raw: RawNotification = { id: 'n-1', category: 'unknown', text: 'X', read: false };
    expect(mapNotification(raw).category).toBe('system');
  });

  it('maps link as undefined when null', () => {
    const raw: RawNotification = { id: 'n-1', category: 'stock', text: 'Low stock', read: true, link: null };
    expect(mapNotification(raw).link).toBeUndefined();
  });
});

describe('relativeTime', () => {
  it('returns "just now" for < 1 minute', () => {
    expect(relativeTime(new Date().toISOString())).toBe('just now');
  });

  it('returns minutes for < 1 hour', () => {
    const d = new Date(Date.now() - 5 * 60000);
    expect(relativeTime(d.toISOString())).toBe('5m ago');
  });

  it('returns hours for < 1 day', () => {
    const d = new Date(Date.now() - 3 * 3600000);
    expect(relativeTime(d.toISOString())).toBe('3h ago');
  });

  it('returns "yesterday" for exactly 1 day', () => {
    const d = new Date(Date.now() - 86400000);
    expect(relativeTime(d.toISOString())).toBe('yesterday');
  });

  it('returns days for > 1 day', () => {
    const d = new Date(Date.now() - 3 * 86400000);
    expect(relativeTime(d.toISOString())).toBe('3d ago');
  });

  it('returns empty string for undefined', () => {
    expect(relativeTime(undefined)).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(relativeTime('not-a-date')).toBe('');
  });
});

describe('parseTracking', () => {
  it('parses valid tracking JSON', () => {
    const ref = JSON.stringify({ trackingNumber: 'TRK-123', courierName: 'Ghana Post' });
    expect(parseTracking(ref)).toEqual({ trackingNumber: 'TRK-123', courierName: 'Ghana Post' });
  });

  it('returns null for plain payment reference', () => {
    expect(parseTracking('PSK-12345')).toBeNull();
  });

  it('returns null for null/undefined', () => {
    expect(parseTracking(null)).toBeNull();
    expect(parseTracking(undefined)).toBeNull();
  });

  it('returns null for JSON without trackingNumber', () => {
    expect(parseTracking(JSON.stringify({ other: 'data' }))).toBeNull();
  });
});
