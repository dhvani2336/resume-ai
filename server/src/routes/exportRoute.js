import express from 'express';
import { exportPdf, exportDocx, getExportHistory } from '../controllers/exportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/export/pdf', protect, exportPdf);
router.post('/export/docx', protect, exportDocx);
router.get('/export/history', protect, getExportHistory);

export default router;
