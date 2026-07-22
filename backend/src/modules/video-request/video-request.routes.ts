import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireVendor, requireAdmin } from '../../middleware/subscription';
import {
  createRequest,
  myRequests,
  adminInbox,
  updateRequest,
} from './video-request.controller';

const router = Router();

// Vendors (businesses) submit and track their AI video campaign requests.
router.post('/', authenticate, requireVendor, createRequest);
router.get('/mine', authenticate, requireVendor, myRequests);

// The platform admin triages and fulfills them.
router.get('/admin', authenticate, requireAdmin, adminInbox);
router.patch('/:id', authenticate, requireAdmin, updateRequest);

export default router;
