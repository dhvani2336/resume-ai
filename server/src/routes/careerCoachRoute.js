import express from 'express';
import { generateCareerRoadmap, getCoachHistory } from '../controllers/careerCoachController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/coach', protect, generateCareerRoadmap);
router.get('/coach/history', protect, getCoachHistory);

export default router;
