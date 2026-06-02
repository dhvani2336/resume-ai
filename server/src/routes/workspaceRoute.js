import express from 'express';
import { 
  createWorkspace, 
  getUserWorkspaces, 
  getWorkspaceDetails, 
  inviteMember, 
  removeMember, 
  shareResume 
} from '../controllers/workspaceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/workspaces', protect, createWorkspace);
router.get('/workspaces', protect, getUserWorkspaces);
router.get('/workspaces/:id', protect, getWorkspaceDetails);
router.post('/workspaces/:id/members', protect, inviteMember);
router.delete('/workspaces/:id/members/:userId', protect, removeMember);
router.post('/workspaces/:id/share', protect, shareResume);

export default router;
