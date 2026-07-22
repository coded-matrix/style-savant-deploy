import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { db } from './config/db';
import { sql } from 'drizzle-orm';
import { config } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import campaignRoutes from './modules/campaign/campaign.routes';
import catalogRoutes from './modules/catalog/catalog.routes';
import vendorRoutes from './modules/vendor/vendor.routes';
import measurementRoutes from './modules/measurement/measurement.routes';
import orderRoutes from './modules/order/order.routes';
import recommendationRoutes from './modules/recommendation/recommendation.routes';
import uploadRoutes from './modules/upload/upload.routes';
import billingRoutes from './modules/payments/payment.routes';
import videoRequestRoutes from './modules/video-request/video-request.routes';
import { config as appConfig } from './config/env';

const app = express();

// Requests arrive through the Next.js /api/backend proxy. Trust exactly that
// one hop so express-rate-limit can identify the real client consistently.
app.set('trust proxy', 1);

app.use(helmet());
app.use(morgan(config.http.logFormat));

app.use(cors({
  // The API is exposed through the same-origin Next.js proxy. Accept the
  // current deployment origin so this image works on Render or locally.
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: config.http.jsonLimit }));

// Regular requests get the short timeout, AI routes (image generation / clean) get the longer one
app.use((req, res, next) => {
  const isAiRoute =
    (req.method === 'POST' && req.path.startsWith('/api/inventory')) ||
    (req.method === 'POST' && req.path.startsWith('/api/campaign')) ||
    (req.method === 'POST' && req.path.startsWith('/api/catalog/tryon'));

  res.setTimeout(isAiRoute ? config.http.aiRequestTimeoutMs : config.http.requestTimeoutMs, () => {
    // Only respond if nothing has been sent yet, otherwise we'd throw "headers already sent"
    if (!res.headersSent) {
      res.status(504).json({ error: 'Request timed out' });
    }
  });
  next();
});

app.get('/health', async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'disconnected' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/campaign', campaignRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', orderRoutes); // payments/verify lives on order router
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/video-requests', videoRequestRoutes);

// Serve locally-stored uploads (STORAGE_DRIVER=local). Allow cross-origin
// <img> loads from the frontend origin — helmet defaults to same-origin CORP,
// which would otherwise block the browser from rendering these images.
app.use(
  '/uploads',
  (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.resolve(process.cwd(), appConfig.storage.localDir), {
    maxAge: '30d',
    fallthrough: false,
  }),
);

// Unknown routes get a JSON 404 instead of Express's default HTML page
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Catches anything that slips through route handlers unhandled
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
