import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest, getVendorId } from '../../middleware/auth';
import { statusForError } from '../../utils/http-error';
import * as service from './vendor.service';
import * as notificationService from '../notification/notification.service';

const CampaignSchema = z.object({
  title: z.string().min(1).max(200),
  prompt: z.string().min(1).max(2000),
  products: z.array(z.string()),
  market: z.string().min(1),
  format: z.string().min(1),
});

const StorefrontSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  logo: z.string().optional(),
  cover: z.string().optional(),
  category: z.string().optional(),
  bio: z.string().max(200).optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().optional(),
  shippingPolicy: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
});

const OrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled', 'confirmed', 'packed', 'shipped', 'delivered']),
});

const OrderTrackingSchema = z.object({
  trackingNumber: z.string().min(1).max(100),
  courierName: z.string().min(1).max(100),
});

const BuyTokensSchema = z.object({
  amount: z.coerce.number().int().positive(),
  reference: z.string().min(1),
});

function fail(res: Response, err: unknown) {
  const message = (err as Error).message;
  res.status(statusForError(message)).json({ error: message });
}

export async function getDashboard(req: AuthRequest, res: Response) {
  try {
    const data = await service.getDashboard(getVendorId(req));
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function getStorefront(req: AuthRequest, res: Response) {
  try {
    const data = await service.getStorefront(getVendorId(req));
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function updateStorefront(req: AuthRequest, res: Response) {
  try {
    const parsed = StorefrontSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await service.updateStorefront(getVendorId(req), parsed.data);
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function getOrders(req: AuthRequest, res: Response) {
  try {
    const data = await service.getOrders(getVendorId(req));
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function getOrderById(req: AuthRequest, res: Response) {
  try {
    const data = await service.getOrderById(req.params.id, getVendorId(req));
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function updateOrderStatus(req: AuthRequest, res: Response) {
  try {
    const parsed = OrderStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await service.updateOrderStatus(req.params.id, getVendorId(req), parsed.data.status);
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function updateOrderTracking(req: AuthRequest, res: Response) {
  try {
    const parsed = OrderTrackingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await service.updateOrderTracking(req.params.id, getVendorId(req), parsed.data);
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function getTokensBalance(req: AuthRequest, res: Response) {
  try {
    const data = await service.getTokensBalance(getVendorId(req));
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function buyTokens(req: AuthRequest, res: Response) {
  try {
    const parsed = BuyTokensSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    // Call the TokenManager via service import
    const vendorId = getVendorId(req);
    // TokenManager is imported in vendor.service
    const { TokenManager } = require('../tokens/token-manager');
    const result = await TokenManager.addTokens(vendorId, parsed.data.amount, parsed.data.reference);
    res.json(result);
  } catch (err) {
    fail(res, err);
  }
}

export async function getCampaigns(req: AuthRequest, res: Response) {
  try {
    const data = await service.getCampaigns(getVendorId(req));
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function createCampaign(req: AuthRequest, res: Response) {
  try {
    const parsed = CampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await service.createCampaign(getVendorId(req), parsed.data);
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function getPayouts(req: AuthRequest, res: Response) {
  try {
    const data = await service.getPayouts(getVendorId(req));
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const data = await notificationService.getNotifications(getVendorId(req));
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function markNotificationsRead(req: AuthRequest, res: Response) {
  try {
    const data = await notificationService.markAllRead(getVendorId(req));
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}
