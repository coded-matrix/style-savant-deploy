import { Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../config/db';
import { videoRequests, products, vendors } from '../../db/schema';
import { AuthRequest } from '../../middleware/auth';
import { TokenManager } from '../tokens/token-manager';
import { config } from '../../config/env';

/**
 * AI video campaigns: a VENDOR submits a campaign request (concept + brief)
 * to the platform ADMIN, who accepts/declines, promises a delivery date, and
 * eventually uploads the finished AI video. Delivery charges the requesting
 * vendor's token balance once.
 */

const createSchema = z.object({
  conceptTitle: z.string().min(3).max(120),
  brief: z.string().min(10).max(4000),
  productId: z.string().uuid().optional(),
  referenceImageUrl: z.string().url().optional(),
});

/** POST /api/video-requests — a vendor requests an AI video campaign. */
export async function createRequest(req: AuthRequest, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' });
    return;
  }
  try {
    const [row] = await db
      .insert(videoRequests)
      .values({ customerId: req.userId!, vendorId: req.vendorId!, ...parsed.data })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

/** GET /api/video-requests/mine — the vendor's own campaign requests. */
export async function myRequests(req: AuthRequest, res: Response) {
  const rows = await db
    .select({
      id: videoRequests.id,
      conceptTitle: videoRequests.conceptTitle,
      brief: videoRequests.brief,
      status: videoRequests.status,
      expectedDeliveryAt: videoRequests.expectedDeliveryAt,
      videoUrl: videoRequests.videoUrl,
      vendorNote: videoRequests.vendorNote,
      referenceImageUrl: videoRequests.referenceImageUrl,
      productId: videoRequests.productId,
      productName: products.name,
      createdAt: videoRequests.createdAt,
    })
    .from(videoRequests)
    .leftJoin(products, eq(videoRequests.productId, products.id))
    .where(eq(videoRequests.vendorId, req.vendorId!))
    .orderBy(desc(videoRequests.createdAt));
  res.json(rows);
}

/** GET /api/video-requests/admin — the admin's inbox of all campaign requests. */
export async function adminInbox(_req: AuthRequest, res: Response) {
  const rows = await db
    .select({
      id: videoRequests.id,
      conceptTitle: videoRequests.conceptTitle,
      brief: videoRequests.brief,
      status: videoRequests.status,
      expectedDeliveryAt: videoRequests.expectedDeliveryAt,
      videoUrl: videoRequests.videoUrl,
      vendorNote: videoRequests.vendorNote,
      referenceImageUrl: videoRequests.referenceImageUrl,
      productId: videoRequests.productId,
      productName: products.name,
      vendorId: videoRequests.vendorId,
      businessName: vendors.businessName,
      createdAt: videoRequests.createdAt,
    })
    .from(videoRequests)
    .leftJoin(products, eq(videoRequests.productId, products.id))
    .leftJoin(vendors, eq(videoRequests.vendorId, vendors.id))
    .orderBy(desc(videoRequests.createdAt));
  res.json(rows);
}

const updateSchema = z.object({
  status: z.enum(['accepted', 'in_progress', 'delivered', 'rejected']).optional(),
  videoUrl: z.string().url().optional(),
  vendorNote: z.string().max(1000).optional(),
  expectedDeliveryAt: z.string().datetime({ offset: true }).optional(),
});

/**
 * PATCH /api/video-requests/:id — ADMIN triages or delivers.
 * Delivering (status -> delivered with a videoUrl) charges the requesting
 * vendor's token balance once; the charge is undone if the update fails.
 */
export async function updateRequest(req: AuthRequest, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid update' });
    return;
  }
  const { status, videoUrl, vendorNote, expectedDeliveryAt } = parsed.data;

  const [existing] = await db
    .select()
    .from(videoRequests)
    .where(eq(videoRequests.id, req.params.id))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  const delivering = status === 'delivered' && existing.status !== 'delivered';
  if (delivering && !(videoUrl || existing.videoUrl)) {
    res.status(400).json({ error: 'A videoUrl is required to deliver a request' });
    return;
  }

  let charged = false;
  try {
    if (delivering) {
      await TokenManager.chargeTokens(
        existing.vendorId,
        config.tokens.videoRequestCost,
        'AI video campaign delivery',
        { feature: 'video_request', requestId: existing.id },
      );
      charged = true;
    }
    const [updated] = await db
      .update(videoRequests)
      .set({
        ...(status ? { status } : {}),
        ...(videoUrl ? { videoUrl } : {}),
        ...(vendorNote !== undefined ? { vendorNote } : {}),
        ...(expectedDeliveryAt ? { expectedDeliveryAt: new Date(expectedDeliveryAt) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(videoRequests.id, existing.id))
      .returning();
    res.json(updated);
  } catch (err) {
    if (charged) {
      await TokenManager.refundTokens(
        existing.vendorId,
        config.tokens.videoRequestCost,
        'Refund: video campaign delivery failed',
        { requestId: existing.id },
      ).catch(() => undefined);
    }
    res.status(402).json({ error: (err as Error).message });
  }
}
