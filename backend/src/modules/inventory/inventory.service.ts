import { eq, and, desc, sql, count } from 'drizzle-orm';
import { db } from '../../config/db';
import { products, aiUsageLogs } from '../../db/schema';
import { editImage } from '../../utils/agnes';
import { TokenManager } from '../tokens/token-manager';
import { TOKEN_COSTS } from '../tokens/token.types';
import { config } from '../../config/env';
import { createNotification } from '../notification/notification.service';

const CLEAN_PROMPT =
  'You are a product photo editor. Remove the background from this clothing item. ' +
  'Replace it with a clean white studio background. Keep the garment sharp and natural. ' +
  'Do not add shadows, hangers, or any props.';

export interface ProductInput {
  name: string;
  description?: string;
  sku?: string;
  price: string;
  category: string;
  stock?: number;
  requiresMeasurements?: boolean;
  published?: boolean;
  images?: string[];
  clothImages?: string[];
}

// List excludes the images column on purpose. Images are base64 and can be megabytes each,
// so we never drag them across the wire for a list. Use getProduct for the full record.
export async function getProducts(vendorId: string) {
  return db
    .select({
      id: products.id,
      vendorId: products.vendorId,
      name: products.name,
      description: products.description,
      sku: products.sku,
      price: products.price,
      category: products.category,
      imageCount: sql<number>`coalesce(array_length(${products.images}, 1), 0)`,
      stock: products.stock,
      requiresMeasurements: products.requiresMeasurements,
      published: products.published,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(eq(products.vendorId, vendorId))
    .orderBy(desc(products.createdAt));
}

export async function getProduct(productId: string, vendorId: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.vendorId, vendorId)));

  if (!product) throw new Error('Product not found');
  return product;
}

export async function addProduct(
  vendorId: string,
  meta: ProductInput,
  image?: { buffer: Buffer; mimeType: string; clean: boolean }
) {
  // Keep each vendor within their product cap (the PRD's lightweight-storage limit)
  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(products)
    .where(eq(products.vendorId, vendorId));

  if (existingCount >= config.limits.maxProductsPerVendor) {
    throw new Error(`Product limit reached. Maximum is ${config.limits.maxProductsPerVendor} products.`);
  }

  const images: string[] = meta.images || [];

  if (image) {
    // Vendors with good studio shots store the photo as-is. clean=true runs the AI (costs tokens).
    if (image.clean) {
      const cleaned = await runAIClean(vendorId, image.buffer, image.mimeType);
      images.push(cleaned);
    } else {
      images.push(image.buffer.toString('base64'));
    }
  }

  const [product] = await db
    .insert(products)
    .values({
      vendorId,
      name: meta.name,
      description: meta.description,
      sku: meta.sku,
      price: meta.price,
      category: meta.category,
      images,
      clothImages: meta.clothImages ?? [],
      stock: meta.stock ?? 0,
      requiresMeasurements: meta.requiresMeasurements ?? false,
      published: meta.published ?? false,
    })
    .returning();

  return product;
}

export async function updateProduct(
  productId: string,
  vendorId: string,
  updates: Partial<ProductInput>
) {
  const [product] = await db
    .update(products)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(products.id, productId), eq(products.vendorId, vendorId)))
    .returning();

  if (!product) throw new Error('Product not found');
  return product;
}

export async function setStock(productId: string, vendorId: string, stock: number) {
  const [product] = await db
    .update(products)
    .set({ stock, updatedAt: new Date() })
    .where(and(eq(products.id, productId), eq(products.vendorId, vendorId)))
    .returning();

  if (!product) throw new Error('Product not found');

  // Best-effort low-stock / sold-out alert — never break the stock update.
  if (stock === 0) {
    createNotification(vendorId, 'stock', `${product.name} is now sold out`, '/vendor/inventory').catch(
      (e) => console.error('Failed to create stock notification:', e),
    );
  } else if (stock <= 3) {
    createNotification(
      vendorId,
      'stock',
      `Low stock on ${product.name} — only ${stock} left`,
      '/vendor/inventory',
    ).catch((e) => console.error('Failed to create stock notification:', e));
  }

  return product;
}

export async function deleteProduct(productId: string, vendorId: string) {
  const [deleted] = await db
    .delete(products)
    .where(and(eq(products.id, productId), eq(products.vendorId, vendorId)))
    .returning({ id: products.id });

  if (!deleted) throw new Error('Product not found');
}

async function runAIClean(vendorId: string, imageBuffer: Buffer, mimeType: string): Promise<string> {
  const cost = TOKEN_COSTS.BACKGROUND_REMOVAL;

  // Fail fast before doing expensive work if the vendor cannot afford it
  if (!(await TokenManager.hasEnoughTokens(vendorId, cost))) {
    throw new Error('Insufficient tokens or inactive subscription');
  }

  try {
    const cleaned = await editImage(imageBuffer, mimeType, CLEAN_PROMPT);

    // Charge only after the work succeeds, so failed generations are free
    await TokenManager.useTokens({
      vendorId,
      featureType: 'background_removal',
      tokensCost: cost,
      description: 'AI Clean on product image',
    });

    await db.insert(aiUsageLogs).values({
      vendorId,
      featureType: 'background_removal',
      tokensCost: cost,
      success: true,
    });

    return cleaned;
  } catch (err) {
    await db.insert(aiUsageLogs).values({
      vendorId,
      featureType: 'background_removal',
      tokensCost: 0,
      success: false,
      errorMessage: (err as Error).message,
    });
    throw err;
  }
}
