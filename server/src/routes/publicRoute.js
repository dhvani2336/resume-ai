import express from 'express';
import { 
  toggleResumeShare, 
  toggleJobMatchShare, 
  getPublicResumeReport, 
  getPublicJobMatchReport 
} from '../controllers/shareController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Private toggles (require authentication)
router.put('/resumes/:id/share', protect, toggleResumeShare);
router.put('/job-match/:id/share', protect, toggleJobMatchShare);

// Public readers (accessible without authentication)
router.get('/public/reports/:token', getPublicResumeReport);
router.get('/public/job-match/:token', getPublicJobMatchReport);

export default router;
