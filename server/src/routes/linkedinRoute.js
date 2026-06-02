import express from 'express';
import { optimizeLinkedInProfile, getLinkedInHistory } from '../controllers/linkedinController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/linkedin', protect, optimizeLinkedInProfile);
router.get('/linkedin', protect, getLinkedInHistory);

export default router;
