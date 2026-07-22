import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import { requireVendor } from '../../middleware/subscription';
import { aiLimiter } from '../../utils/rate-limit';
import { config } from '../../config/env';
import * as controller from './inventory.controller';

const router = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.http.uploadMaxBytes } });

// All product management is vendor-only
router.use(authenticate, requireVendor);

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', aiLimiter, upload.single('image'), controller.create);
router.patch('/:id', controller.update);
router.patch('/:id/stock', controller.setStock);
router.delete('/:id', controller.remove);

export default router;
