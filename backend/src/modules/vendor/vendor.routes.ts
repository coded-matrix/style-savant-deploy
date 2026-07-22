import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireVendor } from '../../middleware/subscription';
import * as controller from './vendor.controller';

const router = Router();

// All vendor endpoints require authentication and a valid vendor profile
router.use(authenticate, requireVendor);

router.get('/dashboard', controller.getDashboard);
router.get('/storefront', controller.getStorefront);
router.patch('/storefront', controller.updateStorefront);

router.get('/orders', controller.getOrders);
router.get('/orders/:id', controller.getOrderById);
router.patch('/orders/:id/status', controller.updateOrderStatus);
router.patch('/orders/:id/tracking', controller.updateOrderTracking);

router.get('/tokens/balance', controller.getTokensBalance);
router.post('/tokens/buy', controller.buyTokens);

router.get('/campaigns', controller.getCampaigns);
router.post('/campaigns', controller.createCampaign);

router.get('/payouts', controller.getPayouts);

router.get('/notifications', controller.getNotifications);
router.patch('/notifications/read-all', controller.markNotificationsRead);

export default router;
