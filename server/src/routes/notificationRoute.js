import express from 'express';
import { 
  getUserNotifications, 
  markNotificationRead, 
  markAllNotificationsRead 
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/notifications', protect, getUserNotifications);
router.put('/notifications/read-all', protect, markAllNotificationsRead);
router.put('/notifications/:id/read', protect, markNotificationRead);

export default router;
