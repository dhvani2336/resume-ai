import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define the upload directory
const uploadDir = path.join(process.cwd(), 'uploads/resumes');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique name: timestamp + random + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `resume-${baseName}-${uniqueSuffix}${ext}`);
  }
});

// File filter to only accept PDF files
const fileFilter = (req, file, cb) => {
  const isPDFMime = file.mimetype === 'application/pdf';
  const isPDFExt = path.extname(file.originalname).toLowerCase() === '.pdf';

  if (isPDFMime && isPDFExt) {
    cb(null, true);
  } else {
    // Pass custom error message to Express error handler
    cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
  }
};

// Multer upload middleware configuration
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  },
  fileFilter: fileFilter
});

// Define avatar upload directory
const avatarDir = path.join(process.cwd(), 'uploads/avatars');

// Ensure avatar upload directory exists
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// Set up storage engine for avatar images
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id || 'guest'}-${uniqueSuffix}${ext}`);
  }
});

// File filter to accept image formats only
const avatarFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WebP files are allowed.'), false);
  }
};

// Multer upload middleware configuration for avatar
export const uploadAvatarMiddleware = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2 MB limit
  },
  fileFilter: avatarFilter
});

