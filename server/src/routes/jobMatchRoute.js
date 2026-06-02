import express from 'express';
import { createJobMatch, getJobMatches, getJobMatchById } from '../controllers/jobMatchController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkSubscriptionLimit } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

router.post('/job-match', protect, checkSubscriptionLimit('job-matches'), createJobMatch);
router.get('/job-match', protect, getJobMatches);
router.get('/job-match/:id', protect, getJobMatchById);

export default router;
