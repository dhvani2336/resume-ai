import fs from 'fs';
import path from 'path';
import { Analysis } from '../models/analysisModel.js';

// GET /api/resumes
export const getResumes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const list = await Analysis.findByUserId(userId);
    return res.status(200).json({
      success: true,
      resumes: list
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/resumes/:id
export const getResumeById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const analysisId = req.params.id;

    const resume = await Analysis.findById(analysisId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume analysis not found.'
      });
    }

    if (resume.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this analysis.'
      });
    }

    return res.status(200).json({
      success: true,
      resume
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/resumes/:id
export const deleteResume = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const analysisId = req.params.id;

    const resume = await Analysis.findById(analysisId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume analysis not found.'
      });
    }

    if (resume.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this analysis.'
      });
    }

    // Delete database entry
    await Analysis.deleteById(analysisId);

    // Physically delete the resume file from uploads directory
    const filePath = path.join(process.cwd(), 'uploads/resumes', resume.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (fileError) {
        console.error(`Failed to delete physical file: ${filePath}`, fileError);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Resume analysis and associated file deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
