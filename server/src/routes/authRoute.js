import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  uploadAvatar,
  deleteAccount
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadAvatarMiddleware } from '../middleware/multer.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, uploadAvatarMiddleware.single('avatar'), uploadAvatar);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.delete('/delete-account', protect, deleteAccount);

export default router;
