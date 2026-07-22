import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../utils/rate-limit';
import { config } from '../../config/env';
import * as controller from './auth.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.http.uploadMaxBytes } });

router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, controller.login);

// Needs a valid token
router.get('/me', authenticate, controller.me);
router.patch('/profile-photo', authenticate, upload.single('photo'), controller.updateProfilePhoto);

export default router;
