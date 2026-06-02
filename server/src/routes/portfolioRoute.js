import express from 'express';
import { generatePortfolio, getPortfolios } from '../controllers/portfolioController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/portfolio', protect, generatePortfolio);
router.get('/portfolio', protect, getPortfolios);

export default router;
