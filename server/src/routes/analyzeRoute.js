import express from 'express';
import { analyzeFile } from '../controllers/analyzeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkSubscriptionLimit } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

// POST /api/analyze
// Expects json payload: { "filename": "[uploadedFilename]" } and Authorization Bearer header
router.post('/analyze', protect, checkSubscriptionLimit('resumes'), analyzeFile);

export default router;