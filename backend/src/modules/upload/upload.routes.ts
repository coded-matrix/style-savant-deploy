import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import { requireVendor } from '../../middleware/subscription';
import { config } from '../../config/env';
import { uploadFiles } from './upload.controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  // Multer's limit is per-file and global to the request; use the larger
  // video cap here — the controller enforces the tighter image cap per type.
  limits: { fileSize: Math.max(config.storage.maxUploadBytes, config.storage.maxVideoUploadBytes) },
});

// Only authenticated vendors may upload product imagery / look videos.
router.post('/', authenticate, requireVendor, upload.array('files', 8), uploadFiles);

export default router;
