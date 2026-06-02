import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Analysis } from '../models/analysisModel.js';
import { CoverLetter } from '../models/coverLetterModel.js';

const parsePdfText = async (filename) => {
  const filePath = path.join(process.cwd(), 'uploads/resumes', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error('The PDF file does not exist on the server.');
  }
  const dataBuffer = fs.readFileSync(filePath);
  const parsedPdf = await pdf(dataBuffer);
  return parsedPdf.text;
};

export const generateCoverLetter = async (req, res, next) => {
  try {
    const { resumeId, jobTitle, company, jobDescription } = req.body;
    const userId = req.user.id;

    if (!resumeId || !jobTitle || !company) {
      return res.status(400).json({
        success: false,
        error: 'Please provide resumeId, jobTitle, and company.'
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
Write a highly professional, persuasive, and tailored cover letter for a candidate applying for the role: "${jobTitle}" at "${company}".

Maximize the connection between the candidate's achievements and experiences in their resume, and the requirements of the job description (if provided). 
Keep it concise, elegant, structured (standard business format), and focused on achievements.

Resume Text:
"""
${pdfText}
"""

Job Description:
"""
${jobDescription || 'No detailed JD provided.'}
"""

Respond with the cover letter text content ONLY. Do not write introductory conversational text or wrap in JSON.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    const savedLetter = await CoverLetter.create({
      userId,
      resumeId,
      jobTitle,
      company,
      jobDescription: jobDescription || '',
      content: responseText
    });

    return res.status(200).json({
      success: true,
      letter: savedLetter
    });
  } catch (error) {
    next(error);
  }
};

export const getCoverLetters = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const list = await CoverLetter.findByUserId(userId);
    return res.status(200).json({
      success: true,
      letters: list
    });
  } catch (error) {
    next(error);
  }
};
