import crypto from 'crypto';
import { Analysis } from '../models/analysisModel.js';
import { JobMatch } from '../models/jobMatchModel.js';

export const toggleResumeShare = async (req, res, next) => {
  try {
    const resumeId = req.params.id;
    const { isPublic } = req.body; // boolean
    const userId = req.user.id;

    const resume = await Analysis.findById(resumeId);
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found.'
      });
    }

    if (resume.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to share this resume.'
      });
    }

    const updates = { isPublic: !!isPublic };
    if (isPublic) {
      // Generate a secure unique share token if not already present
      updates.shareToken = resume.shareToken || crypto.randomBytes(16).toString('hex');
    } else {
      updates.shareToken = null;
    }

    const updatedResume = await Analysis.updateById(resumeId, updates);

    return res.status(200).json({
      success: true,
      message: isPublic ? 'Resume report is now public.' : 'Resume report is now private.',
      resume: updatedResume
    });
  } catch (error) {
    next(error);
  }
};

export const toggleJobMatchShare = async (req, res, next) => {
  try {
    const matchId = req.params.id;
    const { isPublic } = req.body;
    const userId = req.user.id;

    const matchReport = await JobMatch.findById(matchId);
    if (!matchReport) {
      return res.status(404).json({
        success: false,
        error: 'Job match report not found.'
      });
    }

    if (matchReport.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to share this job match report.'
      });
    }

    const updates = { isPublic: !!isPublic };
    if (isPublic) {
      updates.shareToken = matchReport.shareToken || crypto.randomBytes(16).toString('hex');
    } else {
      updates.shareToken = null;
    }

    const updatedMatch = await JobMatch.updateById(matchId, updates);

    return res.status(200).json({
      success: true,
      message: isPublic ? 'Job match report is now public.' : 'Job match report is now private.',
      match: updatedMatch
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicResumeReport = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Share token is required.'
      });
    }

    const resume = await Analysis.findByShareToken(token);
    if (!resume || !resume.isPublic) {
      return res.status(404).json({
        success: false,
        error: 'Shared report not found or sharing has been disabled by the owner.'
      });
    }

    return res.status(200).json({
      success: true,
      resume: {
        originalname: resume.originalname,
        atsScore: resume.atsScore,
        strengths: resume.strengths,
        weaknesses: resume.weaknesses,
        missingSkills: resume.missingSkills,
        suggestions: resume.suggestions,
        createdAt: resume.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicJobMatchReport = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Share token is required.'
      });
    }

    const matchReport = await JobMatch.findByShareToken(token);
    if (!matchReport || !matchReport.isPublic) {
      return res.status(404).json({
        success: false,
        error: 'Shared job match report not found or sharing has been disabled.'
      });
    }

    return res.status(200).json({
      success: true,
      match: {
        originalname: matchReport.originalname,
        jobDescription: matchReport.jobDescription,
        matchScore: matchReport.matchScore,
        matchingSkills: matchReport.matchingSkills,
        missingKeywords: matchReport.missingKeywords,
        strengths: matchReport.strengths,
        improvementSuggestions: matchReport.improvementSuggestions,
        createdAt: matchReport.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};
