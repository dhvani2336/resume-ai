import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Analysis } from '../models/analysisModel.js';
import { LinkedInProfile } from '../models/linkedinModel.js';

const parsePdfText = async (filename) => {
  const filePath = path.join(process.cwd(), 'uploads/resumes', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error('The PDF file does not exist on the server.');
  }
  const dataBuffer = fs.readFileSync(filePath);
  const parsedPdf = await pdf(dataBuffer);
  return parsedPdf.text;
};

export const optimizeLinkedInProfile = async (req, res, next) => {
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
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
Act as a LinkedIn personal branding specialist and professional headhunter.
Analyze the candidate's resume and generate optimized copy for their LinkedIn profile sections.

Optimize:
1. Headline: 3 high-impact, keyword-rich headline options (max 220 chars).
2. About/Summary: A compelling story-driven summary in the first person (max 2000 chars) including core achievements.
3. Experience description templates: Professional experience summaries highlighting metrics and key achievements.
4. Skills: A list of 10 recommended skills to list.

Resume Text:
"""
${pdfText}
"""

You must respond with a JSON object matching this schema:
{
  "headlineOptions": string[],
  "about": string,
  "experienceTemplates": [
    {
      "role": string,
      "company": string,
      "bullets": string[]
    }
  ],
  "recommendedSkills": string[]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    let linkedinData;
    try {
      linkedinData = JSON.parse(responseText);
    } catch (parseErr) {
      return res.status(500).json({
        success: false,
        error: 'AI LinkedIn optimization failed to format as JSON.'
      });
    }

    // Persist log
    const savedRecord = await LinkedInProfile.create({
      userId,
      resumeId,
      headline: linkedinData.headlineOptions,
      about: linkedinData.about,
      experience: linkedinData.experienceTemplates,
      skills: linkedinData.recommendedSkills
    });

    return res.status(200).json({
      success: true,
      profile: savedRecord
    });
  } catch (error) {
    next(error);
  }
};

export const getLinkedInHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const list = await LinkedInProfile.findByUserId(userId);
    return res.status(200).json({
      success: true,
      profiles: list
    });
  } catch (error) {
    next(error);
  }
};
