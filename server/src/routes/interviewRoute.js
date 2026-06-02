import express from 'express';
import { 
  generateQuestions, 
  evaluateAnswer, 
  saveInterviewReport, 
  getInterviewHistory, 
  getInterviewById 
} from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/interview-prep', protect, generateQuestions);
router.post('/interview-prep/evaluate', protect, evaluateAnswer);
router.post('/interview-prep/save', protect, saveInterviewReport);
router.get('/interview-prep/history', protect, getInterviewHistory);
router.get('/interview-prep/history/:id', protect, getInterviewById);

export default router;
