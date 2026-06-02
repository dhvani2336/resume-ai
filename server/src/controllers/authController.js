import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/userModel.js';
import { Analysis } from '../models/analysisModel.js';
import { sendMail } from '../utils/mailer.js';

// Helper to sign JWT tokens
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'resume_ai_secret_key_123', {
    expiresIn: '30d'
  });
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validations
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    // Check if email already registered
    const userExists = await User.findByEmail(email);
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'An account with that email already exists.'
      });
    }

    // Create user in db
    const user = await User.create({ name, email, password });
    const token = generateToken(user.id);

    // Send email verification link
    const verificationUrl = `${req.protocol}://${req.get('host')}/verify-email?token=${user.verificationToken}`;
    await sendMail({
      to: user.email,
      subject: 'Verify your ResumeAI Account',
      text: `Hello ${user.name},\n\nPlease verify your ResumeAI account by navigating to this link:\n${verificationUrl}\n\nThank you!`
    });

    return res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password.'
      });
    }

    // Lookup user email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    // Verify hashed password
    const isMatch = await User.verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const token = generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const analyses = await Analysis.findByUserId(req.user.id);
    return res.status(200).json({
      success: true,
      user: req.user,
      analyses
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    if (!name && !email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name or email to update.'
      });
    }

    const updates = {};
    if (name) updates.name = name;
    
    if (email && email.toLowerCase() !== req.user.email.toLowerCase()) {
      const emailExists = await User.findByEmail(email);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'An account with that email already exists.'
        });
      }
      updates.email = email.toLowerCase();
      // Require re-verification of email
      updates.isVerified = false;
      updates.verificationToken = crypto.randomBytes(32).toString('hex');
    }

    const updatedUser = await User.updateById(userId, updates);

    // If verification token changed, notify
    if (updates.verificationToken) {
      const verificationUrl = `${req.protocol}://${req.get('host')}/verify-email?token=${updates.verificationToken}`;
      await sendMail({
        to: updatedUser.email,
        subject: 'Verify your updated ResumeAI Account',
        text: `Hello ${updatedUser.name},\n\nPlease verify your updated email address by navigating to:\n${verificationUrl}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide current and new passwords.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.'
      });
    }

    // Refetch user with password to compare
    const user = await User.findByEmail(req.user.email);
    const isMatch = await User.verifyPassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Incorrect current password.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.updateById(userId, { password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide your email address.'
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      // Security practice: Return success to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset code has been sent.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    await User.updateById(user.id, {
      resetPasswordOtp: otp,
      resetPasswordOtpExpires: otpExpires
    });

    await sendMail({
      to: user.email,
      subject: 'ResumeAI Password Reset Code',
      text: `Hello ${user.name},\n\nYour password reset verification code is: ${otp}\n\nThis code will expire in 10 minutes.`
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset code has been sent.',
      // Return OTP directly in response in development mode to ease testing
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email, reset OTP, and new password.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    const user = await User.findByEmail(email);
    if (!user || user.resetPasswordOtp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password reset code or email.'
      });
    }

    // Check expiration
    if (new Date() > new Date(user.resetPasswordOtpExpires)) {
      return res.status(400).json({
        success: false,
        error: 'Password reset code has expired.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.updateById(user.id, {
      password: hashedPassword,
      resetPasswordOtp: null,
      resetPasswordOtpExpires: null
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required.'
      });
    }

    const user = await User.findByVerificationToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token.'
      });
    }

    await User.updateById(user.id, {
      isVerified: true,
      verificationToken: null
    });

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully!'
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Account is already verified.'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await User.updateById(userId, { verificationToken: token });

    const verificationUrl = `${req.protocol}://${req.get('host')}/verify-email?token=${token}`;
    await sendMail({
      to: user.email,
      subject: 'Verify your ResumeAI Account',
      text: `Hello ${user.name},\n\nPlease verify your ResumeAI account by navigating to this link:\n${verificationUrl}\n\nThank you!`
    });

    return res.status(200).json({
      success: true,
      message: 'Verification email resent.'
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file.'
      });
    }

    // Static asset location
    const profilePhoto = `/uploads/avatars/${req.file.filename}`;
    const updatedUser = await User.updateById(userId, { profilePhoto });

    return res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};
