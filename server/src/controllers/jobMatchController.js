import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Analysis } from '../models/analysisModel.js';
import { JobMatch } from '../models/jobMatchModel.js';

// POST /api/job-match
export const createJobMatch = async (req, res, next) => {
  try {
    const { resumeId, jobDescription } = req.body;
    const userId = req.user.id;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({
        success: false,
        error: 'Both resumeId and jobDescription parameters are required.'
      });
    }

    if (jobDescription.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Job description text must be at least 20 characters long.'
      });
    }

    // 1. Fetch analysis details & verify ownership
    const resume = await Analysis.findById(resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume profile not found in your account history.'
      });
    }

    if (resume.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this resume file.'
      });
    }

    // 2. Locate resume PDF file and extract text
    const filePath = path.join(process.cwd(), 'uploads/resumes', resume.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'The PDF file associated with this resume could not be located on the server.'
      });
    }

    let pdfText = '';
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const parsedPdf = await pdf(dataBuffer);
      pdfText = parsedPdf.text;
    } catch (parseError) {
      console.error('PDF parsing error in job match endpoint:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to extract text from the PDF file.'
      });
    }

    if (!pdfText || pdfText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Extracted PDF text is empty. Scanned image resumes are not supported.'
      });
    }

    // 3. Connect to Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the backend server.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
Analyze the candidate's resume text content against the provided job description.

Compare the profile skills, experience, and background with the requirements of the job description. Generate:
- A match score (an integer out of 100, representing overall suitability).
- Matching skills (technologies, tools, or concepts found in both the resume and the JD).
- Missing keywords (requirements, languages, or skills in the JD that are absent from the resume).
- Strengths relevant to this specific role (why the candidate fits).
- Actionable improvement suggestions (how to optimize the resume bullets or layout for this job).

Resume Text:
"""
${pdfText}
"""

Job Description:
"""
${jobDescription}
"""

Return a JSON object conforming exactly to this structure:
{
  "matchScore": number,
  "matchingSkills": string[],
  "missingKeywords": string[],
  "strengths": string[],
  "improvementSuggestions": string[]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let analysisData;
    try {
      analysisData = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Failed to parse Gemini JD match response as JSON. Output was:', responseText);
      return res.status(500).json({
        success: false,
        error: 'Failed to process AI job match analysis. The model output was malformed.'
      });
    }

    // 4. Save match report to database history
    const matchReport = await JobMatch.create({
      userId,
      resumeId,
      originalname: resume.originalname,
      jobDescription,
      matchScore: analysisData.matchScore,
      matchingSkills: analysisData.matchingSkills,
      missingKeywords: analysisData.missingKeywords,
      strengths: analysisData.strengths,
      improvementSuggestions: analysisData.improvementSuggestions
    });

    return res.status(200).json({
      success: true,
      match: matchReport
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/job-match
export const getJobMatches = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await JobMatch.findByUserId(userId);
    return res.status(200).json({
      success: true,
      matches: history
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/job-match/:id
export const getJobMatchById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const matchId = req.params.id;

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
        error: 'Not authorized to access this job match report.'
      });
    }

    return res.status(200).json({
      success: true,
      match: matchReport
    });
  } catch (error) {
    next(error);
  }
};
