import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireVendor } from '../../middleware/subscription';
import { billingSummary, subscribe, buyTokens, hubtelWebhook, paymentStatus } from './payment.controller';

const router = Router();

// Public: Hubtel posts the final transaction state here.
router.post('/hubtel/webhook', hubtelWebhook);

// Vendor-authenticated billing endpoints.
router.get('/billing', authenticate, requireVendor, billingSummary);
router.post('/subscribe', authenticate, requireVendor, subscribe);
router.post('/tokens', authenticate, requireVendor, buyTokens);
router.get('/status/:reference', authenticate, requireVendor, paymentStatus);

export default router;
