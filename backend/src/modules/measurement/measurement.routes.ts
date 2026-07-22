import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { saveMeasurement, getMyMeasurement, recommendSize } from './measurement.controller';

const router = Router();

router.post('/', authenticate, saveMeasurement);
router.put('/', authenticate, saveMeasurement);
router.get('/me', authenticate, getMyMeasurement);
router.get('/recommend', authenticate, recommendSize);

export default router;
