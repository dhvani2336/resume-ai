import express from 'express';
import { 
  getUsers, 
  updateUserRole, 
  updateUserSubscription, 
  deleteUser, 
  getSystemAnalytics, 
  getAuditLogs, 
  getErrorLogs 
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin/users', protect, admin, getUsers);
router.put('/admin/users/:id/role', protect, admin, updateUserRole);
router.put('/admin/users/:id/subscription', protect, admin, updateUserSubscription);
router.delete('/admin/users/:id', protect, admin, deleteUser);
router.get('/admin/analytics', protect, admin, getSystemAnalytics);
router.get('/admin/audit-logs', protect, admin, getAuditLogs);
router.get('/admin/error-logs', protect, admin, getErrorLogs);

export default router;
