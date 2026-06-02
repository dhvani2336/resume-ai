import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Analysis } from '../models/analysisModel.js';

export const analyzeFile = async (req, res, next) => {
  try {
    const { filename, originalname, size } = req.body;

    // User is guaranteed to be authenticated by the protect middleware
    const userId = req.user.id;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename parameter is required.'
      });
    }

    const filePath = path.join(process.cwd(), 'uploads/resumes', filename);

    // Verify if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'The uploaded file does not exist.'
      });
    }

    // Extract text from the PDF file
    let pdfText = '';
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const parsedPdf = await pdf(dataBuffer);
      pdfText = parsedPdf.text;
    } catch (parseError) {
      console.error('PDF parsing error:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to extract text from the PDF file.'
      });
    }

    if (!pdfText || pdfText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Extracted PDF text is empty. Scanned image PDFs are not supported.'
      });
    }

    // Initialize Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the backend server. Please configure it in your server .env file.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using gemini-2.5-flash for rapid text extraction & JSON structure compliance
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
Analyze this resume as an ATS (Applicant Tracking System) scanner and a professional talent recruiter.

Evaluate the resume text content and provide:
- An ATS match score (integer from 0 to 100).
- Key strengths of the resume (3 to 5 bullet points).
- Key weaknesses or structural/formatting issues (3 to 5 bullet points).
- Missing industry-standard keywords or technical skills.
- Actionable suggestions for optimization.

Resume Text:
"""
${pdfText}
"""

You must respond with a JSON object matching this schema:
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
      console.error('Failed to parse Gemini response as JSON. Response text was:', responseText);
      return res.status(500).json({
        success: false,
        error: 'Failed to process AI analysis result. The model response was malformed.'
      });
    }

    // Persist scan history if user is authenticated
    if (userId) {
      try {
        await Analysis.create({
          userId,
          originalname: originalname || filename,
          filename,
          size: size || 0,
          atsScore: analysisData.atsScore,
          strengths: analysisData.strengths,
          weaknesses: analysisData.weaknesses,
          missingSkills: analysisData.missingSkills,
          suggestions: analysisData.suggestions
        });
      } catch (dbError) {
        console.error('Error saving analysis history:', dbError);
      }
    }

    return res.status(200).json({
      success: true,
      ...analysisData
    });

  } catch (error) {
    next(error);
  }
};
