import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import { requireActiveSubscription } from '../../middleware/subscription';
import { aiLimiter } from '../../utils/rate-limit';
import { config } from '../../config/env';
import * as controller from './campaign.controller';

const router = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.http.uploadMaxBytes } });

router.use(authenticate);

// Audiences list is just reference data, any logged-in user can read it
router.get('/audiences', controller.getAudiences);

// Generation costs tokens, so it needs an active vendor subscription
router.post('/text', requireActiveSubscription, aiLimiter, upload.single('product'), controller.generateCopy);
router.post('/image', requireActiveSubscription, aiLimiter, upload.single('product'), controller.generateCampaignImage);
router.post('/publish', controller.publishCampaign);

export default router;
