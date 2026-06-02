import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Analysis } from '../models/analysisModel.js';
import { CareerCoach } from '../models/careerCoachModel.js';

const parsePdfText = async (filename) => {
  const filePath = path.join(process.cwd(), 'uploads/resumes', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error('The PDF file does not exist on the server.');
  }
  const dataBuffer = fs.readFileSync(filePath);
  const parsedPdf = await pdf(dataBuffer);
  return parsedPdf.text;
};

export const generateCareerRoadmap = async (req, res, next) => {
  try {
    const { resumeId, targetRole, experienceLevel } = req.body;
    const userId = req.user.id;

    if (!resumeId || !targetRole || !experienceLevel) {
      return res.status(400).json({
        success: false,
        error: 'Please provide resumeId, targetRole, and experienceLevel.'
      });
    }

    const resume = await Analysis.findById(resumeId);
    if (!resume || resume.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Resume profile not found or access denied.'
      });
    }

    let pdfText = '';
    try {
      pdfText = await parsePdfText(resume.filename);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Failed to extract text from your resume PDF.'
      });
    }

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
Act as an elite executive career coach and technical mentor. 
Evaluate the candidate's current background in their resume, and construct a personalized, step-by-step career path roadmap to help them transition into their target role: "${targetRole}" at the "${experienceLevel}" seniority level.

Generate:
1. A chronological roadmap of 3 to 5 milestone steps (e.g., month-by-month or phase-by-phase).
2. Key technical skills and soft skills they must master.
3. Targeted learning recommendations (topics, certification names, or general resources).

Resume Text:
"""
${pdfText}
"""

You must respond with a JSON object matching this schema:
{
  "roadmap": [
    {
      "milestone": string,
      "timeframe": string,
      "tasks": string[]
    }
  ],
  "skills": {
    "technical": string[],
    "soft": string[]
  },
  "learningSuggestions": [
    {
      "topic": string,
      "resources": string[]
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    let coachData;
    try {
      coachData = JSON.parse(responseText);
    } catch (parseErr) {
      return res.status(500).json({
        success: false,
        error: 'AI coach response could not be parsed as JSON.'
      });
    }

    // Persist career roadmap log
    const savedRecord = await CareerCoach.create({
      userId,
      targetRole,
      experienceLevel,
      roadmap: coachData.roadmap,
      skills: coachData.skills,
      learningSuggestions: coachData.learningSuggestions
    });

    return res.status(200).json({
      success: true,
      coach: savedRecord
    });
  } catch (error) {
    next(error);
  }
};

export const getCoachHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await CareerCoach.findByUserId(userId);
    return res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    next(error);
  }
};
