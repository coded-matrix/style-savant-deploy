import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest, getUserId } from '../../middleware/auth';
import { statusForError } from '../../utils/http-error';
import * as service from './auth.service';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(120),
  phone: z.string().max(30).optional(),
  role: z.enum(['customer', 'vendor']).default('customer'),
  businessName: z.string().min(1).max(160).optional(),
  businessCallNumber: z.string().max(30).optional(),
  businessWhatsapp: z.string().max(30).optional(),
}).strict();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
}).strict();

export async function register(req: AuthRequest, res: Response) {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }

    const result = await service.register(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    const message = (err as Error).message;
    res.status(statusForError(message)).json({ error: message });
  }
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await service.login(parsed.data.email, parsed.data.password);
    res.json(result);
  } catch (err) {
    const message = (err as Error).message;
    res.status(statusForError(message)).json({ error: message });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const result = await service.getMe(getUserId(req));
    res.json(result);
  } catch (err) {
    const message = (err as Error).message;
    res.status(statusForError(message)).json({ error: message });
  }
}

export async function updateProfilePhoto(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Photo file is required' });
      return;
    }

    const userId = getUserId(req);
    const result = await service.updateProfilePhoto(userId, req.file.buffer);
    res.json(result);
  } catch (err) {
    const message = (err as Error).message;
    res.status(statusForError(message)).json({ error: message });
  }
}
