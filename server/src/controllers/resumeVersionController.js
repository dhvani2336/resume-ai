import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Analysis } from '../models/analysisModel.js';
import { ResumeVersion } from '../models/resumeVersionModel.js';

const parsePdfText = async (filename) => {
  const filePath = path.join(process.cwd(), 'uploads/resumes', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error('The PDF file does not exist on the server.');
  }
  const dataBuffer = fs.readFileSync(filePath);
  const parsedPdf = await pdf(dataBuffer);
  return parsedPdf.text;
};

export const uploadNewVersion = async (req, res, next) => {
  try {
    const resumeId = req.params.id;
    const { filename, originalname, changesSummary } = req.body;
    const userId = req.user.id;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename parameter is required.'
      });
    }

    const resume = await Analysis.findById(resumeId);
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Original resume profile not found.'
      });
    }

    // Verify ownership
    if (resume.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this resume.'
      });
    }

    // Parse new pdf text
    let pdfText = '';
    try {
      pdfText = await parsePdfText(filename);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: parseError.message || 'Failed to extract text from PDF.'
      });
    }

    // Connect to Gemini to get ATS score of new version
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
Analyze this resume as an ATS scanner and provide:
- An ATS match score (integer from 0 to 100).
- Key strengths of the resume (3 to 5 bullet points).
- Key weaknesses (3 to 5 bullet points).
- Missing industry skills.
- Actionable suggestions.

Resume Text:
"""
${pdfText}
"""

Return JSON matching:
{
  "atsScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "missingSkills": string[],
  "suggestions": string[]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    let analysisData;
    try {
      analysisData = JSON.parse(responseText);
    } catch (jsonError) {
      return res.status(500).json({
        success: false,
        error: 'AI analysis failed to format as JSON.'
      });
    }

    // Fetch existing versions to compute version number
    const existingVersions = await ResumeVersion.findByResumeId(resumeId);
    let nextVersionNumber = 1;
    if (existingVersions.length > 0) {
      nextVersionNumber = Math.max(...existingVersions.map(v => v.versionNumber)) + 1;
    } else {
      // If version history is empty, create version 1 for the original resume first
      await ResumeVersion.create({
        resumeId,
        versionNumber: 1,
        filename: resume.filename,
        originalname: resume.originalname,
        atsScore: resume.atsScore,
        changesSummary: 'Original uploaded version.'
      });
      nextVersionNumber = 2;
    }

    // Create new version
    const newVersion = await ResumeVersion.create({
      resumeId,
      versionNumber: nextVersionNumber,
      filename,
      originalname: originalname || filename,
      atsScore: analysisData.atsScore,
      changesSummary: changesSummary || `Updates for version ${nextVersionNumber}.`
    });

    // Update parent resume score, filename, and analysis details
    await Analysis.updateById(resumeId, {
      filename,
      originalname: originalname || filename,
      atsScore: analysisData.atsScore,
      strengths: analysisData.strengths,
      weaknesses: analysisData.weaknesses,
      missingSkills: analysisData.missingSkills,
      suggestions: analysisData.suggestions
    });

    return res.status(201).json({
      success: true,
      message: `Version ${nextVersionNumber} created successfully.`,
      version: newVersion,
      analysis: analysisData
    });
  } catch (error) {
    next(error);
  }
};

export const getVersionHistory = async (req, res, next) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user.id;

    const resume = await Analysis.findById(resumeId);
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found.'
      });
    }

    // Verify ownership
    if (resume.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view version history.'
      });
    }

    const versions = await ResumeVersion.findByResumeId(resumeId);
    return res.status(200).json({
      success: true,
      versions
    });
  } catch (error) {
    next(error);
  }
};

export const compareVersions = async (req, res, next) => {
  try {
    const resumeId = req.params.id;
    const { v1: v1Id, v2: v2Id } = req.query;
    const userId = req.user.id;

    if (!v1Id || !v2Id) {
      return res.status(400).json({
        success: false,
        error: 'Both v1 and v2 query parameters (version ids) are required.'
      });
    }

    const resume = await Analysis.findById(resumeId);
    if (!resume || resume.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to compare versions for this resume.'
      });
    }

    const version1 = await ResumeVersion.findById(v1Id);
    const version2 = await ResumeVersion.findById(v2Id);

    if (!version1 || !version2) {
      return res.status(404).json({
        success: false,
        error: 'One or both versions could not be located.'
      });
    }

    // Parse texts
    let text1 = '', text2 = '';
    try {
      text1 = await parsePdfText(version1.filename);
      text2 = await parsePdfText(version2.filename);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'Failed to extract text from one or both versions.'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
Compare these two versions of a candidate's resume (Version ${version1.versionNumber} vs Version ${version2.versionNumber}).

Evaluate the changes in content, layout, experience descriptions, and skills. Provide:
- Difference in ATS score.
- Concrete improvements made in the second version.
- New skills, achievements, or project descriptions identified.
- Areas in the second version that still need development.
- A final verdict summarizing which version is stronger and why.

Resume Version 1 Text:
"""
${text1}
"""

Resume Version 2 Text:
"""
${text2}
"""

Return JSON matching this schema:
{
  "atsScoreDiff": number,
  "improvements": string[],
  "newSkillsAndAchievements": string[],
  "remainingGaps": string[],
  "verdict": string
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    let comparisonData;
    try {
      comparisonData = JSON.parse(responseText);
    } catch (jsonError) {
      return res.status(500).json({
        success: false,
        error: 'AI comparison failed to format as JSON.'
      });
    }

    return res.status(200).json({
      success: true,
      comparison: {
        v1: { versionNumber: version1.versionNumber, atsScore: version1.atsScore, originalname: version1.originalname, createdAt: version1.createdAt },
        v2: { versionNumber: version2.versionNumber, atsScore: version2.atsScore, originalname: version2.originalname, createdAt: version2.createdAt },
        ...comparisonData
      }
    });

  } catch (error) {
    next(error);
  }
};
