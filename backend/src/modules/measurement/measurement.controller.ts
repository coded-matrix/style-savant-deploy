import { Request, Response } from 'express';
import { db } from '../../config/db';
import { bodyMeasurements, products } from '../../db/schema';
import { AuthRequest, getUserId } from '../../middleware/auth';
import { eq, desc } from 'drizzle-orm';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export async function saveMeasurement(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const { chest, waist, hips, shoulderWidth, inseam, height, recommendedSize, confidencePercent, rawLandmarks } = req.body;

    const [measurement] = await db.insert(bodyMeasurements).values({
      userId,
      chestInches: chest?.toString(),
      waistInches: waist?.toString(),
      hipsInches: hips?.toString(),
      sleeveLengthInches: shoulderWidth?.toString(), // map shoulderWidth to sleeveLengthInches
      inseamInches: inseam?.toString(),
      heightInches: height?.toString(),
      recommendedSize,
      confidencePercent,
      rawLandmarks,
    }).returning();

    res.json(measurement);
  } catch (error) {
    console.error('Error saving measurement:', error);
    res.status(500).json({ error: 'Failed to save measurement' });
  }
}

export async function getMyMeasurement(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    
    // Get the latest measurement
    const measurements = await db.select()
      .from(bodyMeasurements)
      .where(eq(bodyMeasurements.userId, userId))
      .orderBy(desc(bodyMeasurements.createdAt))
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
      .orderBy(desc(bodyMeasurements.createdAt))
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
