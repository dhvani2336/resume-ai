import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Analysis } from '../models/analysisModel.js';
import { Portfolio } from '../models/portfolioModel.js';

const parsePdfText = async (filename) => {
  const filePath = path.join(process.cwd(), 'uploads/resumes', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error('The PDF file does not exist on the server.');
  }
  const dataBuffer = fs.readFileSync(filePath);
  const parsedPdf = await pdf(dataBuffer);
  return parsedPdf.text;
};

export const generatePortfolio = async (req, res, next) => {
  try {
    const { resumeId } = req.body;
    const userId = req.user.id;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide resumeId.'
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
Act as an award-winning web developer and UI/UX designer.
Analyze the candidate's resume and generate a single-file, highly-stylized HTML/CSS professional portfolio website.

Requirements:
- Self-contained: Put CSS in <style> block, no external assets except standard google fonts and web icons.
- Aesthetics: Dark/semi-transparent glassmorphic cards, deep slate backgrounds, smooth gradients (indigo/purple accents), animations.
- Sections: Hero (with name and animated tagline), About Me, Skills, Work Experience, Projects, Education, and a functional Contact Form placeholder.
- Fully Responsive: Responsive layout, readable margins on mobile.

Resume Text:
"""
${pdfText}
"""

Return the HTML code ONLY. Do not write any conversational text before or after, and do not wrap in markdown quotes. Start with <!DOCTYPE html>.
`;

    const result = await model.generateContent(prompt);
    const htmlResponse = result.response.text().trim();

    // Remove markdown code fences if Gemini included them despite instructions
    const cleanedHtml = htmlResponse
      .replace(/^```html\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    const savedPortfolio = await Portfolio.create({
      userId,
      resumeId,
      htmlContent: cleanedHtml
    });

    return res.status(200).json({
      success: true,
      portfolio: savedPortfolio
    });
  } catch (error) {
    next(error);
  }
};

export const getPortfolios = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const list = await Portfolio.findByUserId(userId);
    return res.status(200).json({
      success: true,
      portfolios: list
    });
  } catch (error) {
    next(error);
  }
};
