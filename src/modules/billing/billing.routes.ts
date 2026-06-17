import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { getBillingOverview } from './billing.controller';

const router = Router();
router.get('/overview', protect, getBillingOverview);

export default router;