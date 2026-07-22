import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export type UserRole = 'customer' | 'vendor' | 'admin';

// What we pack into the JWT and read back out on every request.
// Note: role and vendorId are trusted from the token for its whole lifetime (JWT_EXPIRES_IN).
// If a user's role changes or a vendor is removed, they must re-login to get a fresh token.
// Switch to short-lived access + refresh tokens if instant revocation is ever needed.
export interface TokenPayload {
  userId: string;
  role: UserRole;
  vendorId?: string;
}

export interface AuthRequest extends Request {
  userId?: string;
  role?: UserRole;
  vendorId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  if (!config.jwt.secret) {
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
    req.userId = payload.userId;
    req.role = payload.role;
    req.vendorId = payload.vendorId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function getUserId(req: AuthRequest): string {
  if (!req.userId) throw new Error('Unauthenticated request reached controller');
  return req.userId;
}

// Use on routes that act on a vendor's data. Throws if the user is not a vendor.
export function getVendorId(req: AuthRequest): string {
  if (!req.vendorId) throw new Error('This action requires a vendor account');
  return req.vendorId;
}
