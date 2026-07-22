import { Request, Response } from 'express';
import { db } from '../../config/db';
import { products, looks, orders, orderItems, salesHistory, vendors } from '../../db/schema';
import { AuthRequest, getUserId } from '../../middleware/auth';
import { eq, desc, sql, and, gte, inArray, ne } from 'drizzle-orm';

// Same consumer shape the catalog module returns — the frontend filters on
// priceGHS/vendorName, so raw rows silently disappear from every grid.
async function toConsumerProducts(rows: any[]) {
  const allVendors = await db
    .select({ id: vendors.id, businessName: vendors.businessName })
    .from(vendors);
  const vendorMap = new Map(allVendors.map((v) => [v.id, v.businessName]));
  return rows.map(({ _score, _salesCount, ...p }) => ({
    ...p,
    priceGHS: parseFloat(p.price as string),
    vendorName: vendorMap.get(p.vendorId) || 'Unknown Vendor',
  }));
}

// ── Heuristic weights ──
const W = {
  categoryMatch: 30,    // same category as past purchases
  vendorMatch: 15,      // same vendor as past purchases
  popularity: 25,       // sales volume from sales_history
  freshness: 15,        // newer products rank higher
  inStock: 10,          // penalise out-of-stock
  rating: 5,            // star rating bonus
};

function computeScore(p: any, ctx: {
  purchasedCategories: Map<string, number>;
  purchasedVendors: Map<string, number>;
  maxSales: number;
  maxAgeMs: number;
  now: number;
}): number {
  let score = 0;

  // Category affinity — boost if user bought from same category
  const catCount = ctx.purchasedCategories.get(p.category) ?? 0;
  score += Math.min(catCount, 5) * W.categoryMatch;

  // Vendor affinity — boost if user bought from same vendor
  const vendCount = ctx.purchasedVendors.get(p.vendorId) ?? 0;
  score += Math.min(vendCount, 3) * W.vendorMatch;

  // Popularity — normalised sales count
  const salesScore = ctx.maxSales > 0 ? (p._salesCount ?? 0) / ctx.maxSales : 0;
  score += salesScore * W.popularity;

  // Freshness — newer products get more weight
  const ageMs = ctx.now - new Date(p.createdAt).getTime();
  const freshnessScore = ctx.maxAgeMs > 0 ? 1 - (ageMs / ctx.maxAgeMs) : 0.5;
  score += freshnessScore * W.freshness;

  // In-stock bonus
  if (!p.soldOut && p.stock > 0) score += W.inStock;

  // Rating bonus (normalised 0-1 from 3-5 scale)
  const rating = parseFloat(p.rating ?? '4.0');
  score += Math.max(0, Math.min(1, (rating - 3) / 2)) * W.rating;

  return score;
}

// ── GET /api/recommendations/feed ──
// Ranked looks ordered by votes (with optional time window)
export async function getFeed(req: Request, res: Response) {
  try {
    const requestedLimit = Number.parseInt(String(req.query.limit ?? "5"), 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 5;
    const requestedCursor = Number.parseInt(String(req.query.cursor ?? "0"), 10);
    const cursor = Number.isFinite(requestedCursor) ? Math.max(requestedCursor, 0) : 0;
    const timeWindow = String(req.query.window ?? "all").toLowerCase();

    if (!['today', 'week', 'all'].includes(timeWindow)) {
      res.status(400).json({ error: 'window must be today, week, or all' });
      return;
    }

    const cutoff = timeWindow === 'today'
      ? new Date(Date.now() - 24 * 60 * 60 * 1000)
      : timeWindow === 'week'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : null;

    const rows = await db
      .select()
      .from(looks)
      .where(cutoff ? gte(looks.createdAt, cutoff) : undefined)
      .orderBy(desc(looks.votes))
      .limit(limit + 1)
      .offset(cursor);

    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).map((look) => ({
      ...look,
      createdAt: look.createdAt.toISOString(),
    }));

    res.json({
      items,
      nextCursor: hasMore ? cursor + items.length : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feed" });
  }
}

// ── GET /api/recommendations/explore ──
// Products ranked by heuristic scoring (no auth required)
export async function getExplore(req: Request, res: Response) {
  try {
    const now = Date.now();

    // Get all products
    const allProducts = await db.select().from(products).limit(100);

    // Get sales counts per product
    const salesCounts = await db
      .select({
        productId: salesHistory.productId,
        totalSold: sql<number>`coalesce(sum(${salesHistory.quantitySold}), 0)`.as('totalSold'),
      })
      .from(salesHistory)
      .groupBy(salesHistory.productId);

    const salesMap = new Map(salesCounts.map(s => [s.productId, Number(s.totalSold)]));
    const maxSales = Math.max(1, ...salesCounts.map(s => Number(s.totalSold)));

    // Compute age range for freshness scoring
    const ages = allProducts.map(p => now - new Date(p.createdAt).getTime());
    const maxAgeMs = Math.max(1, ...ages);

    // Score each product (no user context for anonymous explore)
    const scored = allProducts.map(p => ({
      ...p,
      _salesCount: salesMap.get(p.id) ?? 0,
      _score: computeScore(p, {
        purchasedCategories: new Map(),
        purchasedVendors: new Map(),
        maxSales,
        maxAgeMs,
        now,
      }),
    }));

    scored.sort((a, b) => b._score - a._score);
    res.json(await toConsumerProducts(scored.slice(0, 50)));
  } catch (err) {
    console.error('Error in getExplore:', err);
    res.status(500).json({ error: 'Failed to fetch explore data' });
  }
}

// ── GET /api/recommendations/for-you ──
// Personalized feed using the user's order history
export async function getForYou(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const now = Date.now();

    // Fetch user's past orders + items to learn preferences
    const userOrders = await db
      .select({ id: orders.id, vendorId: orders.vendorId })
      .from(orders)
      .where(eq(orders.userId, userId))
      .limit(50);

    const orderIds = userOrders.map(o => o.id);
    const purchasedVendorIds = new Set(userOrders.map(o => o.vendorId));

    // Learn category + vendor affinity from past purchases
    const purchasedCategories = new Map<string, number>();
    const purchasedVendors = new Map<string, number>();

    if (orderIds.length > 0) {
      const userItems = await db
        .select({ productId: orderItems.productId })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));

      const itemProductIds = userItems.map(i => i.productId);
      if (itemProductIds.length > 0) {
        const boughtProducts = await db
          .select({ id: products.id, category: products.category, vendorId: products.vendorId })
          .from(products)
          .where(inArray(products.id, itemProductIds));

        for (const p of boughtProducts) {
          purchasedCategories.set(p.category, (purchasedCategories.get(p.category) ?? 0) + 1);
          purchasedVendors.set(p.vendorId, (purchasedVendors.get(p.vendorId) ?? 0) + 1);
        }
      }
    }

    // Get all products with sales data
    const allProducts = await db.select().from(products).limit(100);

    const salesCounts = await db
      .select({
        productId: salesHistory.productId,
        totalSold: sql<number>`coalesce(sum(${salesHistory.quantitySold}), 0)`.as('totalSold'),
      })
      .from(salesHistory)
      .groupBy(salesHistory.productId);

    const salesMap = new Map(salesCounts.map(s => [s.productId, Number(s.totalSold)]));
    const maxSales = Math.max(1, ...salesCounts.map(s => Number(s.totalSold)));
    const ages = allProducts.map(p => now - new Date(p.createdAt).getTime());
    const maxAgeMs = Math.max(1, ...ages);

    // Score with user context
    const scored = allProducts.map(p => ({
      ...p,
      _salesCount: salesMap.get(p.id) ?? 0,
      _score: computeScore(p, {
        purchasedCategories,
        purchasedVendors,
        maxSales,
        maxAgeMs,
        now,
      }),
    }));

    scored.sort((a, b) => b._score - a._score);
    res.json(await toConsumerProducts(scored.slice(0, 50)));
  } catch (err) {
    console.error('Error in getForYou:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
}

// ── GET /api/recommendations/similar/:productId ──
// Products in the same category/vendor, scored by relevance
export async function getSimilar(req: Request, res: Response) {
  try {
    const { productId } = req.params;
    const [target] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!target) {
      res.json([]);
      return;
    }

    const now = Date.now();

    // Get candidates: same category OR same vendor, excluding the target
    const candidates = await db
      .select()
      .from(products)
      .where(
        and(
          ne(products.id, productId),
          sql`(${products.category} = ${target.category} OR ${products.vendorId} = ${target.vendorId})`
        )
      )
      .limit(20);

    // Get sales data
    const candidateIds = candidates.map(c => c.id);
    const salesCounts = candidateIds.length > 0
      ? await db
          .select({
            productId: salesHistory.productId,
            totalSold: sql<number>`coalesce(sum(${salesHistory.quantitySold}), 0)`.as('totalSold'),
          })
          .from(salesHistory)
          .where(inArray(salesHistory.productId, candidateIds))
          .groupBy(salesHistory.productId)
      : [];

    const salesMap = new Map(salesCounts.map(s => [s.productId, Number(s.totalSold)]));
    const maxSales = Math.max(1, ...salesCounts.map(s => Number(s.totalSold)));
    const ages = candidates.map(c => now - new Date(c.createdAt).getTime());
    const maxAgeMs = Math.max(1, ...ages);

    const scored = candidates.map(c => ({
      ...c,
      _salesCount: salesMap.get(c.id) ?? 0,
      _score: computeScore(c, {
        purchasedCategories: new Map([[target.category, 5]]),
        purchasedVendors: new Map([[target.vendorId, 3]]),
        maxSales,
        maxAgeMs,
        now,
      }),
    }));

    scored.sort((a, b) => b._score - a._score);
    res.json(await toConsumerProducts(scored.slice(0, 10)));
  } catch (err) {
    console.error('Error in getSimilar:', err);
    res.status(500).json({ error: 'Failed to fetch similar products' });
  }
}
