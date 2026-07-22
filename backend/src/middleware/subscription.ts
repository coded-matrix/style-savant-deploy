import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { TokenManager } from '../modules/tokens/token-manager';

// Blocks the route unless the logged-in user is a vendor
export function requireVendor(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.vendorId) {
    res.status(403).json({ error: 'This action requires a vendor account' });
    return;
  }
  next();
}

// Blocks the route unless the logged-in user is a platform administrator
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role !== 'admin') {
    res.status(403).json({ error: 'This action requires an admin account' });
    return;
  }
  next();
}

// Gates AI features: the vendor must have an active token subscription with tokens left.
// Actual token deduction happens inside the AI service once the work succeeds.
export async function requireActiveSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.vendorId) {
      res.status(403).json({ error: 'This action requires a vendor account' });
      return;
    }

    const balance = await TokenManager.getBalance(req.vendorId);

    if (!balance || balance.status !== 'active' || balance.tokensRemaining <= 0) {
      res.status(402).json({ error: 'No active token subscription. Please buy tokens to continue.' });
      return;
    }

    next();
  } catch {
    res.status(500).json({ error: 'Could not verify token balance' });
  }
}
