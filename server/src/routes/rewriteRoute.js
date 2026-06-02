import express from 'express';
import { createRewrite, getRewrites, getRewriteById } from '../controllers/rewriteController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkSubscriptionLimit } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

router.post('/rewrite', protect, checkSubscriptionLimit('rewrites'), createRewrite);
router.get('/rewrite', protect, getRewrites);
router.get('/rewrite/:id', protect, getRewriteById);

export default router;
