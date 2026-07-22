import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './recommendation.controller';

const router = Router();

router.get('/feed', controller.getFeed);
router.get('/explore', controller.getExplore);
router.get('/for-you', authenticate, controller.getForYou);
router.get('/similar/:productId', controller.getSimilar);

export default router;
