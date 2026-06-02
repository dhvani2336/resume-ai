import multer from 'multer';
import { ErrorLog } from '../models/errorLogModel.js';

export const errorHandler = (err, req, res, next) => {
  // Extract userId if available
  const userId = req.user?.id || 'Unauthenticated';

  // Log error in database asynchronously
  ErrorLog.create({
    message: err.message || 'Internal server error.',
    stack: err.stack || '',
    path: req.path || '',
    method: req.method || '',
    userId
  }).catch(logErr => console.error('Failed to save error log to database:', logErr));

  // Catch Multer-specific errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload validation failed: ${err.message}`
    });
  }

  // Catch our custom file filter validation error
  if (err.message === 'Invalid file type. Only PDF files are allowed.') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Log other errors for debugging
  console.error('Unhandled Exception:', err);

  // Return standard 500 error response
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error.'
  });
};
