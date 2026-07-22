import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './order.controller';

const router = Router();

router.post('/', authenticate, controller.createOrder);
router.get('/me', authenticate, controller.getMyOrders);
router.get('/:id', authenticate, controller.getOrderById);
router.post('/webhook', controller.paystackWebhook); // No auth, Paystack calls this

// Payment verification. This router is mounted at both /api/orders and
// /api/payments — the '/verify' path serves the frontend's
// POST /api/payments/verify; the longer alias keeps /api/orders/payments/verify working.
router.post('/verify', authenticate, controller.verifyPayment);
router.post('/payments/verify', authenticate, controller.verifyPayment);

export default router;
