import express from 'express';
import { generateCoverLetter, getCoverLetters } from '../controllers/coverLetterController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/cover-letter', protect, generateCoverLetter);
router.get('/cover-letter', protect, getCoverLetters);

export default router;
