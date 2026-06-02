import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Interview } from '../models/interviewModel.js';
import { Analysis } from '../models/analysisModel.js';

// POST /api/interview-prep
export const generateQuestions = async (req, res, next) => {
  try {
    const { resumeId, targetRole, experienceLevel } = req.body;

    if (!resumeId || !targetRole || !experienceLevel) {
      return res.status(400).json({
        success: false,
        error: 'Please provide resumeId, targetRole, and experienceLevel.'
      });
    }

    const analysis = await Analysis.findById(resumeId);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'The selected resume analysis record was not found.'
      });
    }

    const filePath = path.join(process.cwd(), 'uploads/resumes', analysis.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'The underlying resume PDF file does not exist on the server.'
      });
    }

    // Extract text from the PDF file
    let pdfText = '';
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const parsedPdf = await pdf(dataBuffer);
      pdfText = parsedPdf.text;
    } catch (parseError) {
      console.error('PDF parsing error in Interview Prep:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to extract text from the resume PDF file.'
      });
    }

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
Analyze this candidate's resume and generate tailored interview questions for:
- Target Role: ${targetRole}
- Experience Level: ${experienceLevel}

Resume Text:
"""
${pdfText}
"""

You must generate:
- 3 technical questions based on the candidate's skills and the target role.
- 2 project-specific questions challenging the projects listed in the resume.
- 2 behavioral questions checking cultural fit.
- 1 HR/general question (e.g. background, motivation).
- A set of suggested answers or bullet points key tips for each question.

You must respond with a JSON object matching this schema:
{
  "technicalQuestions": string[],
  "projectQuestions": string[],
  "behavioralQuestions": string[],
  "hrQuestions": string[],
  "suggestedAnswers": [
    {
      "question": string,
      "tips": string
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let prepData;
    try {
      prepData = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Failed to parse Gemini response as JSON. Response text was:', responseText);
      return res.status(500).json({
        success: false,
        error: 'Failed to process interview preparation questions. The model response was malformed.'
      });
    }

    return res.status(200).json({
      success: true,
      ...prepData
    });

  } catch (error) {
    next(error);
  }
};

// POST /api/interview-prep/evaluate
export const evaluateAnswer = async (req, res, next) => {
  try {
    const { question, answer, targetRole, experienceLevel } = req.body;

    if (!question || !answer || !targetRole || !experienceLevel) {
      return res.status(400).json({
        success: false,
        error: 'Please provide question, answer, targetRole, and experienceLevel.'
      });
    }

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
Evaluate the candidate's answer for the following interview question:
- Target Role: ${targetRole}
- Experience Level: ${experienceLevel}
- Question: "${question}"
- Candidate Answer: "${answer}"

Provide evaluation metrics (0 to 100 integers) and feedback:
- Technical Accuracy (evaluating the accuracy and validity of technical points or details)
- Communication Score (evaluating the vocabulary, tone, clarity, and articulation)
- Confidence Score (evaluating the structure, assertiveness, and completeness)
- Actionable suggestions for improvement (1-2 sentences).

You must respond with a JSON object matching this schema:
{
  "technicalAccuracy": number,
  "communicationScore": number,
  "confidenceScore": number,
  "suggestions": string
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let evaluation;
    try {
      evaluation = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Failed to parse Gemini response as JSON. Response text was:', responseText);
      return res.status(500).json({
        success: false,
        error: 'Failed to process evaluation result. The model response was malformed.'
      });
    }

    return res.status(200).json({
      success: true,
      ...evaluation
    });

  } catch (error) {
    next(error);
  }
};

// POST /api/interview-prep/save
export const saveInterviewReport = async (req, res, next) => {
  try {
    const { 
      targetRole, 
      experienceLevel, 
      questions, 
      answers, 
      evaluations, 
      overallScore, 
      strengths, 
      weaknesses, 
      recommendedTopics 
    } = req.body;
    
    const userId = req.user.id;

    if (!targetRole || !experienceLevel || !questions || !answers || !evaluations) {
      return res.status(400).json({
        success: false,
        error: 'Please provide targetRole, experienceLevel, questions, answers, and evaluations.'
      });
    }

    let finalScore = Number(overallScore);
    let finalStrengths = strengths || [];
    let finalWeaknesses = weaknesses || [];
    let finalTopics = recommendedTopics || [];

    // 1. Calculate overall score if not provided
    if (!finalScore && evaluations && evaluations.length > 0) {
      const sum = evaluations.reduce((s, e) => {
        return s + (Number(e.technicalAccuracy) || 0) + (Number(e.communicationScore) || 0) + (Number(e.confidenceScore) || 0);
      }, 0);
      finalScore = Math.round(sum / (evaluations.length * 3));
    }

    // 2. Query Gemini to summarize session strengths & weaknesses if not provided
    if ((!finalStrengths.length || !finalWeaknesses.length) && questions && questions.length > 0) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: 'application/json' }
          });

          const summaryPrompt = `
Generate a final summary report for a completed mock interview session.
- Target Role: ${targetRole}
- Experience Level: ${experienceLevel}
- Questions, Answers & Evaluations:
${questions.map((q, i) => `
Question ${i + 1}: ${q}
Answer: ${answers[i]}
Tech Score: ${evaluations[i]?.technicalAccuracy || 0}, Comm Score: ${evaluations[i]?.communicationScore || 0}, Conf Score: ${evaluations[i]?.confidenceScore || 0}
Suggestions: ${evaluations[i]?.suggestions || ''}
`).join('\n')}

Based on this mock interview session data, compile:
- Observed Strengths (3 bullet points, clear recruiter style, 1 sentence each).
- Observed Weaknesses / areas for improvement (3 bullet points, clear recruiter style, 1 sentence each).
- Recommended Topics to study (3 to 5 key terms or concepts).

You must respond with a JSON object matching this schema:
{
  "strengths": string[],
  "weaknesses": string[],
  "recommendedTopics": string[]
}
`;

          const result = await model.generateContent(summaryPrompt);
          const responseText = result.response.text();
          const summaryData = JSON.parse(responseText);
          
          finalStrengths = summaryData.strengths || [];
          finalWeaknesses = summaryData.weaknesses || [];
          finalTopics = summaryData.recommendedTopics || [];
        } catch (sumError) {
          console.error('Error generating mock interview summary via Gemini:', sumError);
        }
      }
    }

    const newReport = await Interview.create({
      userId,
      targetRole,
      experienceLevel,
      questions,
      answers,
      evaluations,
      overallScore: finalScore,
      strengths: finalStrengths,
      weaknesses: finalWeaknesses,
      recommendedTopics: finalTopics
    });

    return res.status(201).json({
      success: true,
      report: newReport
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/interview-prep/history
export const getInterviewHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await Interview.findByUserId(userId);
    return res.status(200).json({
      success: true,
      interviews: history
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/interview-prep/history/:id
export const getInterviewById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const report = await Interview.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Interview preparation report not found.'
      });
    }

    if (report.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this interview report.'
      });
    }

    return res.status(200).json({
      success: true,
      report
    });

  } catch (error) {
    next(error);
  }
};
