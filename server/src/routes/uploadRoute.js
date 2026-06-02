import express from 'express';
import { uploadFile } from '../controllers/uploadController.js';
import { upload } from '../middleware/multer.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/upload
// Expects multipart/form-data with the file key: 'resume' and Authorization Bearer header
router.post('/upload', protect, upload.single('resume'), uploadFile);

export default router;
