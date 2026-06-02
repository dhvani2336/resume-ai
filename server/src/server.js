import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDb } from './config/db.js';
import uploadRouter from './routes/uploadRoute.js';
import analyzeRouter from './routes/analyzeRoute.js';
import authRouter from './routes/authRoute.js';
import resumeRouter from './routes/resumeRoute.js';
import jobMatchRouter from './routes/jobMatchRoute.js';
import rewriteRouter from './routes/rewriteRoute.js';
import exportRouter from './routes/exportRoute.js';
import analyticsRouter from './routes/analyticsRoute.js';
import interviewRouter from './routes/interviewRoute.js';
import workspaceRouter from './routes/workspaceRoute.js';
import resumeVersionRouter from './routes/resumeVersionRoute.js';
import publicRouter from './routes/publicRoute.js';
import notificationRouter from './routes/notificationRoute.js';
import adminRouter from './routes/adminRoute.js';
import careerCoachRouter from './routes/careerCoachRoute.js';
import coverLetterRouter from './routes/coverLetterRoute.js';
import linkedinRouter from './routes/linkedinRoute.js';
import portfolioRouter from './routes/portfolioRoute.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Enforce JWT_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not configured in production mode.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

// Use Helmet for basic security headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allow static files (uploads) to be loaded cross-origin
}));

// CORS configuration - dynamic allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or Postman requests with no origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting on /api endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});
app.use('/api', apiLimiter);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads directory static assets
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api', uploadRouter);
app.use('/api', analyzeRouter);
app.use('/api', resumeRouter);
app.use('/api', jobMatchRouter);
app.use('/api', rewriteRouter);
app.use('/api', exportRouter);
app.use('/api', analyticsRouter);
app.use('/api', interviewRouter);
app.use('/api/auth', authRouter);
app.use('/api', workspaceRouter);
app.use('/api', resumeVersionRouter);
app.use('/api', publicRouter);
app.use('/api', notificationRouter);
app.use('/api', adminRouter);
app.use('/api', careerCoachRouter);
app.use('/api', coverLetterRouter);
app.use('/api', linkedinRouter);
app.use('/api', portfolioRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ResumeAI API is healthy.' });
});

// Centralized error handling middleware (must be registered after all routes)
app.use(errorHandler);

// Database connection & server start
const startServer = async () => {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`[ResumeAI Server] running on http://localhost:${PORT}`);
    console.log(`[ResumeAI Server] uploads will be stored at: ${path.join(process.cwd(), 'uploads/resumes')}`);
  });
};

startServer().catch(err => {
  console.error('Failed to start ResumeAI Server:', err);
  process.exit(1);
});
