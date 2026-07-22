import { Request, Response } from 'express';
import { createHash } from 'crypto';
import { z } from 'zod';
import { db } from '../../config/db';
import { eq, desc, and } from 'drizzle-orm';
import { artStyles, presetModels, artists, backdrops, vendors, products, looks, users, tryonGallery } from '../../db/schema';
import { AuthRequest, getUserId } from '../../middleware/auth';
import { editImage, detectImageSize } from '../../utils/agnes';
import sharp from 'sharp';
import { addWhiteBorderToGarment } from '../../utils/image-processor';
import { TokenManager } from '../tokens/token-manager';
import { config } from '../../config/env';

export async function getArtStyles(req: Request, res: Response) {
  try {
    const list = await db.select().from(artStyles);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPresetModels(req: Request, res: Response) {
  try {
    const list = await db.select().from(presetModels);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getArtists(req: Request, res: Response) {
  try {
    const list = await db.select().from(artists);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getBackdrops(req: Request, res: Response) {
  try {
    const list = await db.select().from(backdrops);
    const mapped = list.map(b => ({
      ...b,
      priceGHS: b.priceGHS ? parseFloat(b.priceGHS as string) : undefined,
    }));
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getVendors(req: Request, res: Response) {
  try {
    const list = await db.select().from(vendors);
    const mapped = list.map(v => ({
      ...v,
      name: v.businessName,
    }));
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getProducts(req: Request, res: Response) {
  try {
    const list = await db.select().from(products);
    const allVendors = await db.select({ id: vendors.id, businessName: vendors.businessName }).from(vendors);
    const vendorMap = new Map(allVendors.map(v => [v.id, v.businessName]));

    const mapped = list.map(p => ({
      ...p,
      priceGHS: parseFloat(p.price as string),
      vendorName: vendorMap.get(p.vendorId) || 'Unknown Vendor',
    }));
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getProductById(req: Request, res: Response) {
  try {
    const [product] = await db.select().from(products).where(eq(products.id, req.params.id));
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const [vendor] = await db.select({ businessName: vendors.businessName }).from(vendors).where(eq(vendors.id, product.vendorId));
    res.json({
      ...product,
      priceGHS: parseFloat(product.price as string),
      vendorName: vendor?.businessName || 'Unknown Vendor',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getLooks(req: Request, res: Response) {
  try {
    const list = await db.select().from(looks);
    const mapped = list.map(l => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    }));
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

const TryOnSchema = z.object({
  productId: z.string().trim().min(1, 'productId is required'),
  garmentUrl: z.string().url().optional(),
});

export async function generateTryOn(req: AuthRequest, res: Response) {
  const startedAt = Date.now();
  try {
    const parsed = TryOnSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const { productId, garmentUrl: reqGarmentUrl } = parsed.data;

    const userId = getUserId(req);
    const [user] = await db.select({ fitPhoto: users.fitPhoto }).from(users).where(eq(users.id, userId));
    if (!user || !user.fitPhoto) {
      res.status(400).json({ error: 'No profile fit photo uploaded. Please upload a photo first.' });
      return;
    }

    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Try-ons are metered against the product's vendor (2 tokens each). If the
    // vendor's subscription lapsed or their monthly allocation ran out, their
    // items stop being try-on-able until they renew or top up. Cache hits
    // below stay free.
    if (!(await TokenManager.hasEnoughTokens(product.vendorId, config.tokens.tryonCost))) {
      res.status(402).json({ error: 'Try-on is temporarily unavailable for this vendor.' });
      return;
    }

    // fitPhoto may be raw base64 (uploads), a data URI, or a URL (seed data).
    let fitPhotoBuffer: Buffer;
    if (/^https?:\/\//.test(user.fitPhoto)) {
      const photoRes = await fetch(user.fitPhoto);
      if (!photoRes.ok) {
        res.status(502).json({ error: 'Could not load your fit photo. Please re-upload it.' });
        return;
      }
      fitPhotoBuffer = Buffer.from(await photoRes.arrayBuffer());
    } else {
      const b64 = user.fitPhoto.startsWith('data:')
        ? user.fitPhoto.slice(user.fitPhoto.indexOf(',') + 1)
        : user.fitPhoto;
      fitPhotoBuffer = Buffer.from(b64, 'base64');
    }
    const fitPhotoHash = createHash('sha256').update(fitPhotoBuffer).digest('hex');

    // Cache: same user + product + photo → return the saved gallery image
    // instead of paying the 30-110s Agnes round-trip again.
    try {
      const [cached] = await db
        .select({ id: tryonGallery.id, imageBase64: tryonGallery.imageBase64 })
        .from(tryonGallery)
        .where(and(
          eq(tryonGallery.userId, userId),
          eq(tryonGallery.productId, productId),
          eq(tryonGallery.fitPhotoHash, fitPhotoHash),
        ))
        .orderBy(desc(tryonGallery.createdAt))
        .limit(1);
      if (cached) {
        console.log(`[tryon] cache hit userId=${userId} productId=${productId} ms=${Date.now() - startedAt}`);
        res.json({ image: cached.imageBase64, galleryId: cached.id, cached: true });
        return;
      }
    } catch (cacheErr) {
      console.error('[tryon] cache lookup failed (continuing uncached):', cacheErr);
    }

    // Detect the user's photo dimensions so we tell Agnes to produce a
    // matching aspect ratio. A 9:16 portrait photo forced into 1024x1024
    // square gets stretched/distorted. Scale the longer edge to 1024 and
    // keep the shorter edge proportional.
    // Longer edge capped at 768px — fewer pixels for Agnes to generate means a
    // noticeably faster round-trip, and 768 is plenty for a phone-width sheet.
    const dims = detectImageSize(fitPhotoBuffer);
    const targetSize = dims
      ? dims.width >= dims.height
        ? `768x${Math.round(768 * (dims.height / dims.width))}`
        : `${Math.round(768 * (dims.width / dims.height))}x768`
      : '768x768';
    console.log(
      `[tryon] dims detected=${dims ? `${dims.width}x${dims.height}` : 'unknown'} target=${targetSize}`,
    );
    let garmentUrl = reqGarmentUrl || product.images?.[0];
    if (!reqGarmentUrl && product.images && product.images.length > 1) {
      // Consistently index 1 contains the clean clothing cutout/mannequin photo in database seeds
      garmentUrl = product.images[1];
    }
    if (!garmentUrl) {
      res.status(400).json({ error: 'Product does not have any images for try-on' });
      return;
    }

    console.log(`[tryon] Fetching garment from URL: ${garmentUrl}`);
    const garmentRes = await fetch(garmentUrl);
    if (!garmentRes.ok) {
      res.status(502).json({ error: 'Could not load product garment image for try-on.' });
      return;
    }
    const rawGarmentBuffer = Buffer.from(await garmentRes.arrayBuffer()) as any;

    // Determine if we need to clean the background (AI Clean)
    // Run AI Clean if it does not already have an alpha channel or is an Unsplash image
    let needsClean = true;
    if (garmentUrl.includes('aida-public')) {
      needsClean = false;
    } else {
      try {
        const img = sharp(rawGarmentBuffer);
        const meta = await img.metadata();
        if (meta.format === 'png' && meta.hasAlpha) {
          needsClean = false;
        }
      } catch (err) {
        console.warn('[tryon] Failed to parse image metadata, assuming background removal is needed:', err);
      }
    }

    let cleanedBuffer = rawGarmentBuffer;
    if (needsClean) {
      console.log(`[tryon] Running background removal for: ${product.name}`);
      const CLEAN_PROMPT =
        'You are a product photo editor. Your task is to extract ONLY the clothing item. ' +
        'Remove the person wearing the clothes, remove the mannequin, and remove the background. ' +
        'The final image must contain ONLY the garment (like a flat lay or invisible mannequin) on a clean white background. ' +
        'Keep the garment sharp and natural. Do not add shadows, hangers, or any props.';
      try {
        const cleanedB64 = await editImage(rawGarmentBuffer, 'image/jpeg', CLEAN_PROMPT);
        cleanedBuffer = Buffer.from(cleanedB64, 'base64');
      } catch (cleanErr) {
        console.error('[tryon] AI background removal failed, using original garment image:', cleanErr);
      }
    }

    // Add white outline border around the garment cutout
    let processedGarmentBuffer = cleanedBuffer;
    try {
      processedGarmentBuffer = await addWhiteBorderToGarment(cleanedBuffer);
    } catch (borderErr) {
      console.error('[tryon] Failed to add white border, using cleaned image:', borderErr);
    }

    // DEBUG: Dump actual input images sent to the AI
    try {
      const fs = require('fs');
      fs.writeFileSync('debug_person.jpg', fitPhotoBuffer);
      fs.writeFileSync('debug_garment.jpg', processedGarmentBuffer);
      console.log('[DEBUG] Saved debug_person.jpg and debug_garment.jpg successfully');
    } catch (debugErr) {
      console.error('[DEBUG] Failed to write debug images:', debugErr);
    }

    const prompt = [
      `Photorealistic fashion editorial virtual try-on. Image 1 is a person, Image 2 is the garment "${product.name}".`,
      'Dress the person in Image 1 with the garment from Image 2, fitting it realistically with natural draping, shadows, and fabric texture.',
      'CRITICAL: Keep the person\'s face, facial features, skin tone, body proportions, pose, posture, and hands EXACTLY as they are in Image 1.',
      'Keep the entire background, lighting, and composition of Image 1 EXACTLY the same.',
      'The only thing that changes is the clothing — overlay the garment from Image 2 onto the person in Image 1.',
      'The person must remain fully recognizable. Do not generate a new person or alter their identity in any way.',
      'Style: high-fashion editorial photography, studio-quality lighting.',
    ].join(' ');
    console.log(`[tryon] start userId=${userId} productId=${productId} garmentUrl=${garmentUrl.slice(0, 80)}...`);

    // editImage always returns base64. Real images are typically 50-500 KB of
    // b64; anything under ~10 KB of raw bytes is corrupt or an error blob.
    const isPlausible = (b64: string) => b64.length > 10 * 1024 * (4 / 3);
    let output = await editImage(fitPhotoBuffer, 'image/jpeg', prompt, targetSize, processedGarmentBuffer, 0.45);
    if (!isPlausible(output)) {
      console.warn(`[tryon] implausible result (${output.length} b64 chars) — retrying once`);
      output = await editImage(fitPhotoBuffer, 'image/jpeg', prompt, targetSize, processedGarmentBuffer, 0.45);
    }
    const looksLikeRealImage = isPlausible(output);
    if (!looksLikeRealImage) {
      res.status(502).json({ error: 'Virtual try-on unavailable for this look right now. Please try again later.' });
      return;
    }
    console.log(
      `[tryon] ok userId=${userId} productId=${productId} ms=${Date.now() - startedAt} b64Bytes=${output.length} plausible=${looksLikeRealImage}`,
    );

    // Meter the successful try-on against the product's vendor. Best-effort:
    // a charge race losing here must not fail the customer's try-on.
    try {
      await TokenManager.chargeTokens(product.vendorId, config.tokens.tryonCost, 'Customer virtual try-on', {
        feature: 'tryon',
        productId,
      });
    } catch (chargeErr) {
      console.error('[tryon] token charge failed (continuing):', chargeErr);
    }

    // Auto-save to the user's gallery so they can revisit past fits.
    let galleryId: string | undefined;
    if (looksLikeRealImage) {
      try {
        const [saved] = await db
          .insert(tryonGallery)
          .values({
            userId,
            productId,
            productName: product.name,
            imageBase64: output,
            fitPhotoHash,
          })
          .returning({ id: tryonGallery.id });
        galleryId = saved?.id;
      } catch (saveErr) {
        console.error('[tryon] gallery save failed:', saveErr);
        // Non-blocking — we still return the image even if save fails.
      }
    }

    if (!res.headersSent) {
      res.json({ image: output, galleryId });
    }
  } catch (err: any) {
    console.error(`[tryon] FAIL userId=${(req as any).userId} ms=${Date.now() - startedAt} error=${err?.message} code=${err?.code}`);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
}

// ─── Gallery ────────────────────────────────────────────────────────

export async function listGallery(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const items = await db
      .select({
        id: tryonGallery.id,
        productId: tryonGallery.productId,
        productName: tryonGallery.productName,
        imageBase64: tryonGallery.imageBase64,
        createdAt: tryonGallery.createdAt,
      })
      .from(tryonGallery)
      .where(eq(tryonGallery.userId, userId))
      .orderBy(desc(tryonGallery.createdAt));
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteGalleryItem(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const result = await db
      .delete(tryonGallery)
      .where(and(eq(tryonGallery.id, id), eq(tryonGallery.userId, userId)))
      .returning({ id: tryonGallery.id });
    if (result.length === 0) {
      res.status(404).json({ error: 'Gallery item not found' });
      return;
    }
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
