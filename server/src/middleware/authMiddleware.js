import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';

export const protect = async (req, res, next) => {
  let token;

  // Verify Bearer token presence in Authorization headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token string
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'resume_ai_secret_key_123');

      // Fetch user profile associated with decoded ID
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized, user profile not found.'
        });
      }

      // Attach user object to the request lifecycle
      req.user = user;
      return next();
    } catch (error) {
      console.error('JWT Token Verification Error:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Not authorized, token verification failed.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, access token is missing.'
    });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrator privileges required.'
    });
  }
};
