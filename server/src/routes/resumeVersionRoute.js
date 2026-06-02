import express from 'express';
import { 
  uploadNewVersion, 
  getVersionHistory, 
  compareVersions 
} from '../controllers/resumeVersionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/resumes/:id/versions', protect, uploadNewVersion);
router.get('/resumes/:id/versions', protect, getVersionHistory);
router.get('/resumes/:id/versions/compare', protect, compareVersions);

export default router;
