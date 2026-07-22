import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest, getVendorId } from '../../middleware/auth';
import { statusForError } from '../../utils/http-error';
import * as service from './inventory.service';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidId(id: string, res: Response): boolean {
  if (!UUID_REGEX.test(id)) {
    res.status(400).json({ error: 'Invalid product ID format' });
    return false;
  }
  return true;
}

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sku: z.string().max(100).optional(),
  price: z.coerce.number().positive(),
  category: z.string().min(1).max(100),
  stock: z.coerce.number().int().min(0).optional(),
  requiresMeasurements: z.coerce.boolean().optional(),
  published: z.coerce.boolean().optional(),
  clean: z.coerce.boolean().optional(),
  images: z.preprocess((val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return [val]; }
    }
    return val;
  }, z.array(z.string())).optional(),
  clothImages: z.preprocess((val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return [val]; }
    }
    return val;
  }, z.array(z.string())).optional(),
});

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  sku: z.string().max(100).optional(),
  price: z.coerce.number().positive().optional(),
  category: z.string().min(1).max(100).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  requiresMeasurements: z.coerce.boolean().optional(),
  published: z.coerce.boolean().optional(),
  images: z.preprocess((val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return [val]; }
    }
    return val;
  }, z.array(z.string())).optional(),
  clothImages: z.preprocess((val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return [val]; }
    }
    return val;
  }, z.array(z.string())).optional(),
}).strict();

const StockSchema = z.object({
  stock: z.coerce.number().int().min(0),
});

function fail(res: Response, err: unknown) {
  const message = (err as Error).message;
  res.status(statusForError(message)).json({ error: message });
}

export async function list(req: AuthRequest, res: Response) {
  try {
    res.json(await service.getProducts(getVendorId(req)));
  } catch (err) {
    fail(res, err);
  }
}

export async function get(req: AuthRequest, res: Response) {
  try {
    if (!isValidId(req.params.id, res)) return;
    res.json(await service.getProduct(req.params.id, getVendorId(req)));
  } catch (err) {
    fail(res, err);
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }

    const { clean, price, stock, ...rest } = parsed.data;

    const image = req.file
      ? { buffer: req.file.buffer, mimeType: req.file.mimetype, clean: clean ?? false }
      : undefined;

    const item = await service.addProduct(
      getVendorId(req),
      { ...rest, price: String(price), stock: stock ?? 0 },
      image
    );

    res.status(201).json(item);
  } catch (err) {
    fail(res, err);
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    if (!isValidId(req.params.id, res)) return;

    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }

    // price is decimal in the DB, which Drizzle represents as a string
    const updates = {
      ...parsed.data,
      price: parsed.data.price !== undefined ? String(parsed.data.price) : undefined,
    };

    res.json(await service.updateProduct(req.params.id, getVendorId(req), updates));
  } catch (err) {
    fail(res, err);
  }
}

export async function setStock(req: AuthRequest, res: Response) {
  try {
    if (!isValidId(req.params.id, res)) return;

    const parsed = StockSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'stock must be a non-negative integer' });
      return;
    }

    res.json(await service.setStock(req.params.id, getVendorId(req), parsed.data.stock));
  } catch (err) {
    fail(res, err);
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    if (!isValidId(req.params.id, res)) return;

    await service.deleteProduct(req.params.id, getVendorId(req));
    res.status(204).send();
  } catch (err) {
    fail(res, err);
  }
}
