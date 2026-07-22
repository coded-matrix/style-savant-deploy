import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { orders, subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET || "";
    if (!webhookSecret) {
      console.error('PAYSTACK_WEBHOOK_SECRET not configured - cannot verify webhook signatures');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const hash = crypto.createHmac('sha512', webhookSecret).update(body).digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let event: any;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error('Failed to parse webhook payload:', err);
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    switch (event.event) {
      case 'charge.success':
        if (event.data) await handleSuccessfulPayment(event.data);
        break;
      case 'subscription.create':
      case 'subscription.enable':
        if (event.data) await handleSubscriptionActivation(event.data);
        break;
      case 'subscription.disable':
        if (event.data) await handleSubscriptionCancellation(event.data);
        break;
      default:
        console.log('Unhandled event type:', event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSuccessfulPayment(data: any) {
  const reference = data.reference;
  const metadata = data.metadata;

  if (metadata.type === 'order') {
    await db.update(orders).set({ status: 'processing', paymentReference: reference }).where(eq(orders.id, metadata.orderId));
  } else if (metadata.type === 'subscription') {
    await db.update(subscriptions).set({ status: 'active', paymentReference: reference }).where(eq(subscriptions.id, metadata.subscriptionId));
  }
}

async function handleSubscriptionActivation(data: any) {
  console.log('Subscription activated:', data);
}

async function handleSubscriptionCancellation(data: any) {
  console.log('Subscription cancelled:', data);
}
