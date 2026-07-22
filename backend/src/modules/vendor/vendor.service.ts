import { eq, and, desc, sql, sum, count } from 'drizzle-orm';
import { db } from '../../config/db';
import {
  users,
  vendors,
  products,
  orders,
  orderItems,
  bodyMeasurements,
  campaigns,
  tokenTransactions,
  subscriptions,
} from '../../db/schema';
import { TokenManager } from '../tokens/token-manager';
import { getAI, TEXT_MODEL } from '../../utils/gemini';
import { editImage } from '../../utils/agnes';

// Strip markdown block fences
function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

export async function getDashboard(vendorId: string) {
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId));
  if (!vendor) throw new Error('Vendor not found');

  // Count active listings
  const [{ value: activeListings }] = await db
    .select({ value: count() })
    .from(products)
    .where(and(eq(products.vendorId, vendorId), eq(products.published, true)));

  // Count pending orders
  const [{ value: pendingOrders }] = await db
    .select({ value: count() })
    .from(orders)
    .where(and(eq(orders.vendorId, vendorId), eq(orders.status, 'pending')));

  // Sum net earnings: (orders totalAmount where status != cancelled) * 0.92
  const [salesResult] = await db
    .select({ value: sum(orders.totalAmount) })
    .from(orders)
    .where(and(eq(orders.vendorId, vendorId), sql`${orders.status} != 'cancelled'`));

  const totalSales = Number(salesResult?.value || 0);
  const netEarnings = totalSales * 0.92;

  // Token balance
  const tokenBalance = await TokenManager.getBalance(vendorId);

  return {
    businessName: vendor.businessName,
    logo: vendor.logo,
    verified: vendor.verified,
    activeListings,
    pendingOrders,
    totalSales,
    netEarnings,
    tokenBalance: tokenBalance || {
      tokensTotal: 0,
      tokensUsed: 0,
      tokensRemaining: 0,
      status: 'expired',
      lowBalanceAlert: true,
    },
  };
}

export async function getStorefront(vendorId: string) {
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId));
  if (!vendor) throw new Error('Vendor not found');
  return vendor;
}

export async function updateStorefront(
  vendorId: string,
  meta: {
    businessName?: string;
    description?: string;
    logo?: string;
    cover?: string;
    category?: string;
    bio?: string;
  }
) {
  const [updated] = await db
    .update(vendors)
    .set({
      ...meta,
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, vendorId))
    .returning();

  return updated;
}

export async function getOrders(vendorId: string) {
  const results = await db
    .select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
      customerName: users.name,
      customerPhone: users.phone,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.vendorId, vendorId))
    .orderBy(desc(orders.createdAt));

  // Fetch items for each order
  const orderList = [];
  for (const o of results) {
    const items = await db
      .select({
        productId: orderItems.productId,
        name: products.name,
        quantity: orderItems.quantity,
        price: orderItems.price,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, o.id));

    // Determine if any item requires measurements (bespoke order)
    const isBespoke = items.length > 0; // standard mockup simplifies this

    // Calculate payouts
    const gross = Number(o.totalAmount);
    const fee = gross * 0.08;
    const net = gross - fee;

    orderList.push({
      ...o,
      items,
      bespoke: isBespoke,
      gross,
      fee,
      net,
    });
  }

  return orderList;
}

export async function getOrderById(orderId: string, vendorId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.vendorId, vendorId)));

  if (!order) throw new Error('Order not found');

  const [customer] = await db
    .select({
      name: users.name,
      phone: users.phone,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, order.userId));

  const items = await db
    .select({
      productId: orderItems.productId,
      name: products.name,
      quantity: orderItems.quantity,
      price: orderItems.price,
      images: products.images,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, order.id));

  let measurements = null;
  if (order.measurementId) {
    const [meas] = await db
      .select()
      .from(bodyMeasurements)
      .where(eq(bodyMeasurements.id, order.measurementId));
    if (meas) {
      measurements = {
        // Measurements remain canonical inches across the API. Clients may
        // convert them for display, but a vendor must never receive values
        // whose unit depends on which endpoint returned them.
        chest: meas.chestInches == null ? null : Number(meas.chestInches),
        bust: meas.bustInches == null ? null : Number(meas.bustInches),
        underbust: meas.underbustInches == null ? null : Number(meas.underbustInches),
        shoulderWidth: meas.shoulderWidthInches == null ? null : Number(meas.shoulderWidthInches),
        neck: meas.neckInches == null ? null : Number(meas.neckInches),
        sleeveLength: meas.sleeveLengthInches == null ? null : Number(meas.sleeveLengthInches),
        bicep: meas.bicepInches == null ? null : Number(meas.bicepInches),
        wrist: meas.wristInches == null ? null : Number(meas.wristInches),
        backLength: meas.backLengthInches == null ? null : Number(meas.backLengthInches),
        waist: meas.waistInches == null ? null : Number(meas.waistInches),
        hips: meas.hipsInches == null ? null : Number(meas.hipsInches),
        thigh: meas.thighInches == null ? null : Number(meas.thighInches),
        knee: meas.kneeInches == null ? null : Number(meas.kneeInches),
        calf: meas.calfInches == null ? null : Number(meas.calfInches),
        inseam: meas.inseamInches == null ? null : Number(meas.inseamInches),
        outseam: meas.outseamInches == null ? null : Number(meas.outseamInches),
        height: meas.heightInches == null ? null : Number(meas.heightInches),
        note: meas.notes,
        confidencePercent: meas.confidencePercent,
      };
    }
  }

  const gross = Number(order.totalAmount);
  const fee = gross * 0.08;
  const net = gross - fee;

  return {
    ...order,
    customer,
    items,
    measurements,
    gross,
    fee,
    net,
  };
}

export async function updateOrderStatus(orderId: string, vendorId: string, status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'confirmed' | 'packed' | 'shipped' | 'delivered') {
  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.vendorId, vendorId)))
    .returning();

  if (!updated) throw new Error('Order not found or update failed');
  return updated;
}

export async function updateOrderTracking(
  orderId: string,
  vendorId: string,
  meta: { trackingNumber: string; courierName: string }
) {
  // Update paymentReference column to store tracking data as a simple format or JSON
  const [updated] = await db
    .update(orders)
    .set({
      paymentReference: JSON.stringify({
        trackingNumber: meta.trackingNumber,
        courierName: meta.courierName,
      }),
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.vendorId, vendorId)))
    .returning();

  if (!updated) throw new Error('Order not found or update failed');
  return updated;
}

export async function getCampaigns(vendorId: string) {
  return db
    .select()
    .from(campaigns)
    .where(eq(campaigns.vendorId, vendorId))
    .orderBy(desc(campaigns.createdAt));
}

export async function createCampaign(
  vendorId: string,
  meta: {
    title: string;
    prompt: string;
    products: string[];
    market: string;
    format: string;
  }
) {
  // We charge 80 tokens for a text + image campaign
  const cost = 80;
  if (!(await TokenManager.hasEnoughTokens(vendorId, cost))) {
    throw new Error('Insufficient tokens or inactive subscription');
  }

  // Fetch product context
  const selectedProducts = [];
  for (const pid of meta.products) {
    const [p] = await db.select().from(products).where(and(eq(products.id, pid), eq(products.vendorId, vendorId)));
    if (p) selectedProducts.push(p);
  }

  if (selectedProducts.length === 0) {
    throw new Error('At least one valid vendor product must be selected');
  }

  const pNames = selectedProducts.map((p) => p.name).join(', ');
  const pBriefs = selectedProducts.map((p) => `${p.name}: ${p.description || ''}`).join('\n');

  // Let's call Gemini to generate the campaign caption
  const ai = getAI();
  const audienceText = meta.market === 'Diaspora' 
    ? 'international diaspora and global buyers interested in African fashion and artisanship'
    : 'Ghanaian local market buyers who value quality, affordability, and local fashion trends';

  const campaignPrompt =
    `You are a social media marketing expert for an African fashion brand. ` +
    `The target audience is: ${audienceText}. ` +
    `The campaign format is: ${meta.format}. ` +
    `Merchant prompt brief: "${meta.prompt}". \n` +
    `Here are the products to feature:\n${pBriefs}\n\n` +
    `Generate marketing copy in this exact JSON format: ` +
    `{ "caption": "...", "hashtags": ["...", "..."] }. ` +
    `Keep the caption under 150 characters. Include 5 to 8 hashtags. ` +
    `Return only the JSON, no markdown.`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ role: 'user', parts: [{ text: campaignPrompt }] }],
  });

  const raw = stripJsonFences(response.text ?? '');
  let generated: { caption: string; hashtags: string[] };
  try {
    generated = JSON.parse(raw);
  } catch {
    throw new Error('Gemini returned malformed campaign copy. Please try again.');
  }

  // Generate image using Agnes
  let imageUrl = 'https://picsum.photos/seed/campaign/600/600';
  const sourceProduct = selectedProducts[0];
  if (sourceProduct && sourceProduct.images && sourceProduct.images.length > 0) {
    try {
      const base64Image = sourceProduct.images[0];
      const buffer = Buffer.from(base64Image, 'base64');
      const agnesPrompt = `Create a high-end social media campaign ad graphic featuring ${pNames}. Muted editorial background, natural studio lighting. Prompt: ${meta.prompt}`;
      const cleanedImage = await editImage(buffer, 'image/jpeg', agnesPrompt);
      imageUrl = cleanedImage;
    } catch (err) {
      console.error('Agnes campaign image generation failed, falling back to original image:', err);
      // Fallback to the product's original base64 image or picsum
      imageUrl = sourceProduct.images[0].startsWith('http') 
        ? sourceProduct.images[0]
        : `data:image/jpeg;base64,${sourceProduct.images[0]}`;
    }
  }

  // Deduct tokens
  await TokenManager.chargeTokens(vendorId, cost, `Generated campaign: ${meta.title}`, {
    feature: 'campaign_creator',
    products: meta.products,
  });

  // Save to Campaigns history
  const [newCampaign] = await db
    .insert(campaigns)
    .values({
      id: `cmp-${Date.now()}`,
      vendorId,
      title: meta.title,
      caption: generated.caption,
      hashtags: generated.hashtags,
      image: imageUrl,
      products: meta.products,
      prompt: meta.prompt,
      market: meta.market,
      format: meta.format,
      tokens: cost,
    })
    .returning();

  return newCampaign;
}

export async function getTokensBalance(vendorId: string) {
  const balance = await TokenManager.getBalance(vendorId);
  return balance || {
    vendorId,
    tokensTotal: 0,
    tokensUsed: 0,
    tokensRemaining: 0,
    status: 'expired',
    lowBalanceAlert: true,
  };
}

export async function getPayouts(vendorId: string) {
  // Aggregate sales
  const [salesResult] = await db
    .select({ value: sum(orders.totalAmount) })
    .from(orders)
    .where(and(eq(orders.vendorId, vendorId), sql`${orders.status} != 'cancelled'`));

  const totalSales = Number(salesResult?.value || 0);
  const netEarnings = totalSales * 0.92;

  // Let's mock payout transactions
  return {
    netEarnings,
    totalSales,
    availablePayout: netEarnings * 0.35, // Mock subset available
    bankConnected: true,
    bankName: 'GCB Bank',
    accountNumber: '******1234',
  };
}
