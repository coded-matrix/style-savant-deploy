import { Request, Response } from 'express';
import { db } from '../../config/db';
import { orders, orderItems, products, bodyMeasurements, salesHistory, users } from '../../db/schema';
import { AuthRequest, getUserId } from '../../middleware/auth';
import { eq, desc, inArray, and } from 'drizzle-orm';
import crypto from 'crypto';
import { config } from '../../config/env';
import { createNotification } from '../notification/notification.service';

// ── Mock Paystack helpers (swap for real HTTP calls when keys are live) ──

function mockInitializeTransaction(reference: string, amount: number, email: string) {
  // In production: POST https://api.paystack.co/transaction/initialize
  // with { amount: amount * 100, email, reference, callback_url, metadata }
  const amountKobo = amount * 100;
  return {
    status: true,
    data: {
      authorization_url: `/paystack-mock?ref=${reference}&amount=${amountKobo}`,
      access_code: `mock_ac_${crypto.randomBytes(6).toString('hex')}`,
      reference,
    },
  };
}

function verifyWebhookSignature(body: any, signature: string | undefined): boolean {
  const secret = config.paystack.webhookSecret;
  if (!secret || secret.startsWith('your_')) return true; // skip in dev mode
  if (!signature) return false;
  const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(body)).digest('hex');
  return hash === signature;
}

// ── POST /api/orders ──
export async function createOrder(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const { items, shippingAddress, paymentMethod } = req.body;
    // items: { productId, size, color, qty }[]

    if (!items || items.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    const productIds = items.map((i: any) => i.productId);
    const productList = await db.select().from(products).where(inArray(products.id, productIds));
    const productMap = new Map(productList.map(p => [p.id, p]));

    // Group items by vendor
    const byVendor = new Map<string, any[]>();
    for (const item of items) {
      const p = productMap.get(item.productId);
      if (!p) continue;
      if (!byVendor.has(p.vendorId)) byVendor.set(p.vendorId, []);
      byVendor.get(p.vendorId)!.push({ ...item, product: p });
    }

    // Get user measurement if needed
    const needsMeasurement = productList.some(p => p.requiresMeasurements);
    let measurementId = null;
    if (needsMeasurement) {
      const ms = await db.select().from(bodyMeasurements).where(eq(bodyMeasurements.userId, userId)).orderBy(desc(bodyMeasurements.createdAt)).limit(1);
      if (ms.length > 0) measurementId = ms[0].id;
    }

    const createdOrders = [];
    const paymentReference = `REF-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // Create an order for each vendor
    for (const [vendorId, vendorItems] of byVendor.entries()) {
      let totalAmount = 0;
      for (const item of vendorItems) {
        totalAmount += parseFloat(item.product.price) * item.qty;
      }
      totalAmount += 30; // delivery fee

      const [order] = await db.insert(orders).values({
        userId,
        vendorId,
        totalAmount: totalAmount.toString(),
        shippingAddress,
        measurementId,
        paymentReference,
        status: 'pending',
      }).returning();

      for (const item of vendorItems) {
        await db.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.qty,
          price: item.product.price,
        });
      }

      createdOrders.push(order);

      // Best-effort vendor notification — never let this break order creation.
      const itemCount = vendorItems.reduce((n, it) => n + it.qty, 0);
      createNotification(
        vendorId,
        'orders',
        `New order received — ${itemCount} item${itemCount === 1 ? '' : 's'}, GHS ${totalAmount.toFixed(2)}`,
        `/vendor/orders/${order.id}`,
      ).catch((e) => console.error('Failed to create order notification:', e));
    }

    // Initialize Paystack transaction (mock or real)
    const userList = await db.select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const email = userList[0]?.email ?? 'customer@savant.gh';
    const totalForPayment = createdOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    const paystackResult = mockInitializeTransaction(paymentReference, totalForPayment, email);

    res.json({
      orders: createdOrders,
      reference: paymentReference,
      authorization_url: paystackResult.data.authorization_url,
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

// ── GET /api/orders/me ──
export async function getMyOrders(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const myOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    res.json(myOrders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

// ── GET /api/orders/:id ──
export async function getOrderById(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

    res.json({ ...order, items });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
}

// ── POST /api/orders/webhook ──
export async function paystackWebhook(req: Request, res: Response) {
  try {
    // Verify Paystack signature in production
    if (!verifyWebhookSignature(req.body, req.headers['x-paystack-signature'] as string)) {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      
      // Update all orders with this reference
      await db.update(orders)
        .set({ status: 'confirmed' })
        .where(eq(orders.paymentReference, reference));

      // Write to sales_history for inventory forecasting
      const paidOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.paymentReference, reference));

      for (const order of paidOrders) {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        for (const item of items) {
          await db.insert(salesHistory).values({
            vendorId: order.vendorId,
            productId: item.productId,
            quantitySold: item.quantity,
            revenue: (parseFloat(item.price) * item.quantity).toString(),
            saleDate: new Date(),
          });
        }
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Error in webhook:', err);
    res.status(500).send('Error');
  }
}

// ── POST /api/payments/verify ──
export async function verifyPayment(req: AuthRequest, res: Response) {
  try {
    const { reference } = req.body;
    if (!reference) {
      res.status(400).json({ error: 'Reference required' });
      return;
    }

    // In production: GET https://api.paystack.co/transaction/verify/:reference
    // For mock mode, just check if the order exists and mark it confirmed
    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentReference, reference));

    if (orderList.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Mark as confirmed (in real mode, verify amount matches)
    await db.update(orders)
      .set({ status: 'confirmed' })
      .where(eq(orders.paymentReference, reference));

    // Write sales history
    for (const order of orderList) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      for (const item of items) {
        await db.insert(salesHistory).values({
          vendorId: order.vendorId,
          productId: item.productId,
          quantitySold: item.quantity,
          revenue: (parseFloat(item.price) * item.quantity).toString(),
          saleDate: new Date(),
        });
      }
    }

    res.json({ status: 'success', reference });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
}
