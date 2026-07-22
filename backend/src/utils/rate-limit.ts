import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

// Shared limiter for any route that calls an AI model. Keeps the API bill sane.
export const aiLimiter = rateLimit({
  windowMs: config.rateLimit.aiWindowMs,
  max: config.rateLimit.aiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a minute.' },
});

// Tighter limiter for login and register so nobody can brute-force passwords.
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});
