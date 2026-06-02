import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Analysis } from '../models/analysisModel.js';
import { Rewrite } from '../models/rewriteModel.js';

// POST /api/rewrite
export const createRewrite = async (req, res, next) => {
  try {
    const { resumeId, resumeText, targetRole } = req.body;
    const userId = req.user.id;

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        error: 'targetRole parameter is required.'
      });
    }

    let originalContent = '';
    let originalname = 'Manual Paste';

    // 1. Determine input source (either resumeId or direct resumeText)
    if (resumeId) {
      const resume = await Analysis.findById(resumeId);
      if (!resume) {
        return res.status(404).json({
          success: false,
          error: 'Resume profile not found.'
        });
      }
      if (resume.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this resume profile.'
        });
      }

      originalname = resume.originalname;

      // Extract text from PDF
      const filePath = path.join(process.cwd(), 'uploads/resumes', resume.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'The PDF file associated with this resume could not be found on the server.'
        });
      }

      try {
        const dataBuffer = fs.readFileSync(filePath);
        const parsedPdf = await pdf(dataBuffer);
        originalContent = parsedPdf.text;
      } catch (parseError) {
        console.error('PDF parsing error in rewrite endpoint:', parseError);
        return res.status(500).json({
          success: false,
          error: 'Failed to extract text from the PDF file.'
        });
      }
    } else if (resumeText) {
      originalContent = resumeText;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either resumeId or resumeText parameter is required.'
      });
    }

    if (!originalContent || originalContent.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Resume content is empty or too short.'
      });
    }

    // 2. Connect to Gemini API
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
Analyze this resume text content and professionally rewrite it to optimize for the target role: "${targetRole}".

Improve the text on:
- Bullet points (make them results-driven, utilizing the STAR or XYZ method where applicable).
- Project and experience descriptions (inject strong, professional action verbs and outline technical complexity).
- Achievement statements (quantify results, impact, or outcomes).
- ATS optimization (seamlessly embed standard keyword requirements for a "${targetRole}").

Resume Text to Rewrite:
"""
${originalContent}
"""

Generate:
1. rewrittenContent (the fully rewritten resume/profile text in clean markdown structure).
2. improvements (an array of strings summarizing key adjustments made, e.g. "Swapped generic verbs with industry terms", "Quantified experience metrics").
3. atsImpact (a short statement rating or explaining how these adjustments help bypass automated applicant trackers).

You must return a JSON object conforming to this schema:
{
  "rewrittenContent": string,
  "improvements": string[],
  "atsImpact": string
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let analysisData;
    try {
      analysisData = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Failed to parse Gemini rewrite output as JSON. Output was:', responseText);
      return res.status(500).json({
        success: false,
        error: 'Failed to process AI resume rewriting. The model output was malformed.'
      });
    }

    // 3. Save rewrite report to database history
    const rewriteReport = await Rewrite.create({
      userId,
      resumeId: resumeId || null,
      originalname,
      targetRole,
      originalContent,
      rewrittenContent: analysisData.rewrittenContent,
      improvements: analysisData.improvements,
      atsImpact: analysisData.atsImpact
    });

    return res.status(200).json({
      success: true,
      rewrite: rewriteReport
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/rewrite
export const getRewrites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await Rewrite.findByUserId(userId);
    return res.status(200).json({
      success: true,
      rewrites: history
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/rewrite/:id
export const getRewriteById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rewriteId = req.params.id;

    const rewriteReport = await Rewrite.findById(rewriteId);

    if (!rewriteReport) {
      return res.status(404).json({
        success: false,
        error: 'Rewrite history record not found.'
      });
    }

    if (rewriteReport.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this rewrite record.'
      });
    }

    return res.status(200).json({
      success: true,
      rewrite: rewriteReport
    });
  } catch (error) {
    next(error);
  }
};
