const { Type } = require('@google/genai');
const { GENERAL_SYSTEM_PROMPT, getGeneralUserPrompt } = require('../prompts/generalPrompt');
const { FRESHER_SYSTEM_PROMPT, getFresherUserPrompt } = require('../prompts/fresherPrompt');
const { INTERNSHIP_SYSTEM_PROMPT, getInternshipUserPrompt } = require('../prompts/internshipPrompt');
const { LINKEDIN_SYSTEM_PROMPT, getLinkedinUserPrompt } = require('../prompts/linkedinPrompt');
const { safeJsonParse, sanitizeAnalysisResult } = require('../utils/scoreUtils');
const createAiServiceError = require('../utils/aiServiceError');
const {
  generateContentWithRetries,
  MAX_JOB_DESCRIPTION_CHARS,
  MAX_RESUME_CHARS
} = require('./geminiClient');

/**
 * Defines Gemini Response Schema matching required structured output
 */
const getResponseSchema = (mode) => {
  const schema = {
    type: Type.OBJECT,
    properties: {
      overallScore: { type: Type.INTEGER, description: 'Overall ATS score from 0 to 100' },
      breakdown: {
        type: Type.OBJECT,
        properties: {
          keywordMatch: { type: Type.INTEGER, description: 'Score for keyword matching 0-100' },
          skillsMatch: { type: Type.INTEGER, description: 'Score for technical & soft skills match 0-100' },
          experienceRelevance: { type: Type.INTEGER, description: 'Score for experience relevance 0-100' },
          formatting: { type: Type.INTEGER, description: 'Score for ATS readability & structure 0-100' },
          education: { type: Type.INTEGER, description: 'Score for educational background match 0-100' }
        },
        required: ['keywordMatch', 'skillsMatch', 'experienceRelevance', 'formatting', 'education']
      },
      matchedKeywords: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      missingKeywords: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            importance: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
            whereToAdd: { type: Type.STRING }
          },
          required: ['keyword', 'importance', 'whereToAdd']
        }
      },
      strengths: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      suggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            section: { type: Type.STRING },
            issue: { type: Type.STRING },
            improvement: { type: Type.STRING },
            exampleRewrite: { type: Type.STRING }
          },
          required: ['section', 'issue', 'improvement', 'exampleRewrite']
        }
      },
      summary: { type: Type.STRING }
    },
    required: ['overallScore', 'breakdown', 'matchedKeywords', 'missingKeywords', 'strengths', 'suggestions', 'summary']
  };

  if (mode === 'linkedin') {
    schema.properties.linkedinOptimization = {
      type: Type.OBJECT,
      properties: {
        headline: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        aboutSection: { type: Type.STRING },
        skillsToAdd: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ['headline', 'aboutSection', 'skillsToAdd']
    };
  }

  return schema;
};

/**
 * Analyzes resume against job description using Google Gemini API
 * Includes 2 retry attempts and score sanitization/clamping.
 * 
 * @param {string} resumeText - Extracted resume text
 * @param {string} jobDescription - Target job description text
 * @param {string} mode - 'general' | 'fresher' | 'internship' | 'linkedin'
 * @returns {Promise<Object>} - Sanitized ATS analysis result object
 */
const analyzeResumeWithGemini = async (resumeText, jobDescription, mode = 'general') => {
  const boundedResumeText = resumeText.slice(0, MAX_RESUME_CHARS);
  const boundedJobDescription = jobDescription.slice(0, MAX_JOB_DESCRIPTION_CHARS);

  let systemPrompt;
  let userPrompt;

  switch (mode) {
    case 'fresher':
      systemPrompt = FRESHER_SYSTEM_PROMPT;
      userPrompt = getFresherUserPrompt(boundedResumeText, boundedJobDescription);
      break;
    case 'internship':
      systemPrompt = INTERNSHIP_SYSTEM_PROMPT;
      userPrompt = getInternshipUserPrompt(boundedResumeText, boundedJobDescription);
      break;
    case 'linkedin':
      systemPrompt = LINKEDIN_SYSTEM_PROMPT;
      userPrompt = getLinkedinUserPrompt(boundedResumeText, boundedJobDescription);
      break;
    case 'general':
    default:
      systemPrompt = GENERAL_SYSTEM_PROMPT;
      userPrompt = getGeneralUserPrompt(boundedResumeText, boundedJobDescription);
      break;
  }

  const schema = getResponseSchema(mode);

  try {
    const response = await generateContentWithRetries(userPrompt, {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.2
    });
    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini API.');
    }

    const parsedJson = safeJsonParse(responseText);
    return sanitizeAnalysisResult(parsedJson);
  } catch (error) {
    const status = Number(error.status || error.statusCode);
    console.error(`[Gemini Service] Analysis failed: name=${error.name}, status=${status || 'unknown'}`);
    throw createAiServiceError(error);
  }
};

module.exports = { analyzeResumeWithGemini };
