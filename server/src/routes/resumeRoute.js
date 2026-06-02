import express from 'express';
import { getResumes, getResumeById, deleteResume } from '../controllers/resumeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/resumes', protect, getResumes);
router.get('/resumes/:id', protect, getResumeById);
router.delete('/resumes/:id', protect, deleteResume);

export default router;
