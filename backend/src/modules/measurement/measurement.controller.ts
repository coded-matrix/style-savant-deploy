import { Request, Response } from 'express';
import { db } from '../../config/db';
import { bodyMeasurements, products } from '../../db/schema';
import { AuthRequest, getUserId } from '../../middleware/auth';
import { eq } from 'drizzle-orm';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/** Every measurement the client may send, in inches. */
const FIELDS = [
  'chest', 'bust', 'underbust', 'shoulderWidth', 'neck', 'sleeveLength',
  'bicep', 'wrist', 'backLength',
  'waist', 'hips', 'thigh', 'knee', 'calf', 'inseam', 'outseam',
  'height',
] as const;

/** camelCase input key -> the `*Inches` column it maps to. */
const COLUMN: Record<string, string> = Object.fromEntries(
  FIELDS.map((f) => [f, `${f}Inches`]),
);

/**
 * Convert the request body into a column patch. Only keys actually present
 * are included, so a partial edit never blanks the fields it left alone.
 * A key sent as null explicitly clears that measurement.
 */
function toPatch(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  for (const f of FIELDS) {
    if (!(f in body)) continue;
    const v = body[f];
    if (v === null || v === '') {
      patch[COLUMN[f]] = null;
      continue;
    }
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 120) {
      throw new Error(`${f} must be a number between 0 and 120 inches`);
    }
    patch[COLUMN[f]] = n.toFixed(2);
  }
  if ('notes' in body) patch.notes = body.notes ?? null;
  if ('recommendedSize' in body) patch.recommendedSize = body.recommendedSize;
  if ('confidencePercent' in body) patch.confidencePercent = body.confidencePercent;
  if ('rawLandmarks' in body) patch.rawLandmarks = body.rawLandmarks;
  return patch;
}

/**
 * POST/PUT /api/measurements — upsert the caller's measurements.
 *
 * Upserts on userId rather than inserting a new row each time: measurements
 * are a living record a user corrects, not an append-only log.
 */
export async function saveMeasurement(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    let patch: Record<string, unknown>;
    try {
      patch = toPatch(req.body ?? {});
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }

    const [measurement] = await db
      .insert(bodyMeasurements)
      .values({ userId, ...patch })
      .onConflictDoUpdate({
        target: bodyMeasurements.userId,
        set: { ...patch, updatedAt: new Date() },
      })
      .returning();

    res.json(measurement);
  } catch (error) {
    console.error('Error saving measurement:', error);
    res.status(500).json({ error: 'Failed to save measurement' });
  }
}

export async function getMyMeasurement(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    
    const measurements = await db.select()
      .from(bodyMeasurements)
      .where(eq(bodyMeasurements.userId, userId))
      .limit(1);

    if (measurements.length === 0) {
      res.json(null);
      return;
    }

    res.json(measurements[0]);
  } catch (error) {
    console.error('Error fetching measurement:', error);
    res.status(500).json({ error: 'Failed to fetch measurement' });
  }
}

export async function recommendSize(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const productId = req.query.productId as string;

    if (!productId) {
      res.status(400).json({ error: 'productId is required' });
      return;
    }

    // Get user's latest measurement
    const measurements = await db.select()
      .from(bodyMeasurements)
      .where(eq(bodyMeasurements.userId, userId))
      .limit(1);

    if (measurements.length === 0) {
      res.status(404).json({ error: 'No measurements found for user' });
      return;
    }
    const measurement = measurements[0];

    // Get product
    const productList = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (productList.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const product = productList[0];
    const availableSizes = product.sizes as string[];

    if (!availableSizes || availableSizes.length === 0) {
      res.json({ recommendedSize: null, confidencePercent: 0, fit: 'unknown' });
      return;
    }

    const chest = measurement.chestInches ? parseFloat(measurement.chestInches) : null;
    const waist = measurement.waistInches ? parseFloat(measurement.waistInches) : null;
    const hips = measurement.hipsInches ? parseFloat(measurement.hipsInches) : null;
    const height = measurement.heightInches ? parseFloat(measurement.heightInches) : null;

    const category = (product.category || '').toLowerCase();
    const isBottom = /pant|trouser|jean|short|skirt|bottom/.test(category);

    // Chest drives tops, waist drives bottoms; the other measurements refine.
    const chestIdx = chest === null ? null
      : chest < 34 ? 0 : chest < 36 ? 1 : chest < 40 ? 2 : chest < 44 ? 3 : chest < 48 ? 4 : 5;
    const waistIdx = waist === null ? null
      : waist < 28 ? 0 : waist < 30 ? 1 : waist < 33 ? 2 : waist < 36 ? 3 : waist < 40 ? 4 : 5;
    const hipsIdx = hips === null ? null
      : hips < 34 ? 0 : hips < 37 ? 1 : hips < 40 ? 2 : hips < 43 ? 3 : hips < 47 ? 4 : 5;

    const primaryIdx = isBottom ? (waistIdx ?? hipsIdx ?? chestIdx) : (chestIdx ?? waistIdx ?? hipsIdx);
    const secondaryIdx = isBottom ? hipsIdx : waistIdx;

    let sizeIdx = primaryIdx ?? 2; // default M when nothing measured
    let fit: 'true-to-size' | 'size-up' | 'size-down' | 'custom-fit' = 'true-to-size';

    // If the secondary measurement lands a full band larger, size up for comfort.
    if (secondaryIdx !== null && primaryIdx !== null) {
      if (secondaryIdx - primaryIdx >= 2) {
        sizeIdx = Math.min(sizeIdx + 1, SIZE_ORDER.length - 1);
        fit = 'size-up';
      } else if (primaryIdx - secondaryIdx >= 2) {
        fit = 'size-down';
      }
    }

    // Very tall users tend to need the longer cut of the next size on tops.
    if (!isBottom && height !== null && height >= 74 && sizeIdx < SIZE_ORDER.length - 1) {
      sizeIdx = Math.min(sizeIdx + 1, SIZE_ORDER.length - 1);
      fit = fit === 'true-to-size' ? 'size-up' : fit;
    }

    let predictedSize = SIZE_ORDER[sizeIdx];

    // Confidence: base landmark confidence scaled by measurement completeness.
    const provided = [chest, waist, hips, height,
      measurement.inseamInches ? 1 : null,
      measurement.sleeveLengthInches ? 1 : null].filter((v) => v !== null).length;
    const completeness = provided / 6;
    const base = measurement.confidencePercent || 85;
    let confidencePercent = Math.round(base * (0.6 + 0.4 * completeness));

    // Product-specific availability: fall back to the nearest available size.
    let note: string | null = null;
    if (!availableSizes.includes(predictedSize)) {
      const ranked = availableSizes
        .map((s) => ({ s, d: Math.abs(SIZE_ORDER.indexOf(s) - sizeIdx) }))
        .filter((r) => SIZE_ORDER.indexOf(r.s) !== -1)
        .sort((a, b) => a.d - b.d);
      if (ranked.length > 0) {
        const closest = ranked[0].s;
        note = `Your recommended size ${predictedSize} isn't available for this item — we suggest ${closest}`;
        fit = SIZE_ORDER.indexOf(closest) > sizeIdx ? 'size-up' : 'size-down';
        predictedSize = closest;
        confidencePercent = Math.max(50, confidencePercent - 10);
      } else {
        // Non-standard sizing (e.g. numeric) — recommend nothing specific.
        predictedSize = availableSizes[0];
        fit = 'custom-fit';
        confidencePercent = Math.max(40, confidencePercent - 20);
      }
    }

    const alternatives = [sizeIdx - 1, sizeIdx + 1]
      .filter((i) => i >= 0 && i < SIZE_ORDER.length)
      .map((i) => SIZE_ORDER[i])
      .filter((s) => availableSizes.includes(s) && s !== predictedSize)
      .map((s) => ({
        size: s,
        confidence: Math.max(30, confidencePercent - 25),
        note: SIZE_ORDER.indexOf(s) > sizeIdx ? 'Relaxed fit' : 'Slim fit',
      }));

    res.json({
      recommendedSize: predictedSize,
      confidencePercent,
      fit,
      alternatives,
      ...(note ? { note } : {}),
    });
  } catch (error) {
    console.error('Error recommending size:', error);
    res.status(500).json({ error: 'Failed to recommend size' });
  }
}
