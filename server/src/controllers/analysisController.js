const Analysis = require('../models/Analysis');
const { randomBytes } = require('crypto');
const { parsePdfBuffer } = require('../services/pdfService');
const { analyzeResumeWithGemini } = require('../services/geminiService');
const { checkParseability } = require('../utils/parseabilityUtils');

/**
 * @desc    Upload PDF resume, analyze with Gemini AI, save & return result
 * @route   POST /api/analyses
 * @access  Private
 */
const createAnalysis = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF resume file.'
      });
    }

    const { jobDescription, mode = 'general', jobTitle = '' } = req.body;

    if (!jobDescription || typeof jobDescription !== 'string' ||
        jobDescription.trim().length < 20 || jobDescription.trim().length > 20000) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid job description between 20 and 20000 characters.'
      });
    }

    const validModes = ['general', 'fresher', 'internship', 'linkedin'];
    const selectedMode = validModes.includes(mode) ? mode : 'general';

    // 1. Extract clean text from PDF
    const resumeText = await parsePdfBuffer(req.file.buffer);

    // 2. Call Gemini AI Service
    const aiResult = await analyzeResumeWithGemini(resumeText, jobDescription.trim(), selectedMode);

    // 3. Save to database
    const newAnalysis = await Analysis.create({
      userId: req.user._id,
      mode: selectedMode,
      resumeFileName: req.file.originalname || 'resume.pdf',
      resumeText,
      parseability: checkParseability(resumeText),
      jobTitle: jobTitle.trim() || 'Target Position',
      jobDescription: jobDescription.trim(),
      result: aiResult
    });

    res.status(201).json({
      success: true,
      message: 'Resume analysis completed successfully',
      data: newAnalysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Analyze generated resume text with Gemini and save the result
 * @route   POST /api/analyses/text
 * @access  Private
 */
const createAnalysisFromText = async (req, res, next) => {
  try {
    const { resumeText, jobDescription, jobTitle = '', mode = 'general' } = req.body || {};
    const validModes = ['general', 'fresher', 'internship', 'linkedin'];

    if (typeof resumeText !== 'string' || !resumeText.trim() || resumeText.trim().length > 100000) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resume text between 1 and 100000 characters.'
      });
    }

    if (typeof jobDescription !== 'string' ||
        jobDescription.trim().length < 20 || jobDescription.trim().length > 20000) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid job description between 20 and 20000 characters.'
      });
    }

    if (typeof mode !== 'string' || !validModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid analysis mode.'
      });
    }

    if (typeof jobTitle !== 'string' || jobTitle.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Job title must be a string of no more than 200 characters.'
      });
    }

    const normalizedResumeText = resumeText.trim();
    const normalizedJobDescription = jobDescription.trim();
    const normalizedJobTitle = jobTitle.trim() || 'Target Position';
    const aiResult = await analyzeResumeWithGemini(
      normalizedResumeText,
      normalizedJobDescription,
      mode
    );

    const newAnalysis = await Analysis.create({
      userId: req.user._id,
      mode,
      resumeFileName: `generated-resume-${Date.now()}.txt`,
      resumeText: normalizedResumeText,
      parseability: checkParseability(normalizedResumeText),
      jobTitle: normalizedJobTitle,
      jobDescription: normalizedJobDescription,
      result: aiResult
    });

    return res.status(201).json({
      success: true,
      message: 'Resume analysis completed successfully',
      data: newAnalysis
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Get paginated history of user's past analyses
 * @route   GET /api/analyses
 * @access  Private
 */
const getAnalyses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Analysis.countDocuments({ userId: req.user._id });

    const analyses = await Analysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('mode resumeFileName jobTitle result.overallScore result.summary createdAt');

    const formattedList = analyses.map((item) => ({
      id: item._id,
      jobTitle: item.jobTitle || 'Target Position',
      overallScore: item.result?.overallScore || 0,
      mode: item.mode,
      resumeFileName: item.resumeFileName,
      summary: item.result?.summary || '',
      createdAt: item.createdAt
    }));

    res.status(200).json({
      success: true,
      count: formattedList.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      data: formattedList
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single full analysis by ID
 * @route   GET /api/analyses/:id
 * @access  Private
 */
const getAnalysisById = async (req, res, next) => {
  try {
    const analysis = await Analysis.findById(req.params.id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found.'
      });
    }

    // Security check: user must own the analysis
    if (analysis.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this analysis record.'
      });
    }

    const data = analysis.toObject();
    data.parseability = data.parseability?.length ? data.parseability : checkParseability(analysis.resumeText);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const createShareLink = async (req, res, next) => {
  const body = req.body || {};
  const invalidField = Object.keys(body).find((field) => field !== 'expiresAt');
  if (invalidField) {
    return res.status(400).json({ success: false, message: `Unsupported share setting: ${invalidField}.` });
  }
  let expiresAt = null;
  if (body.expiresAt !== undefined && body.expiresAt !== null && body.expiresAt !== '') {
    if (typeof body.expiresAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(body.expiresAt)) {
      return res.status(400).json({ success: false, message: 'Expiry must be a valid future ISO date.' });
    }
    expiresAt = new Date(body.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      return res.status(400).json({ success: false, message: 'Expiry must be a valid future ISO date.' });
    }
  }

  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user._id }).select('+shareToken');
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis record not found.' });
    }
    analysis.shareToken = randomBytes(32).toString('hex');
    analysis.shareExpiresAt = expiresAt;
    await analysis.save();
    return res.status(200).json({
      success: true,
      data: {
        token: analysis.shareToken,
        expiresAt: analysis.shareExpiresAt
      }
    });
  } catch (error) {
    return next(error);
  }
};

const revokeShareLink = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user._id }).select('+shareToken');
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis record not found.' });
    }
    analysis.shareToken = undefined;
    analysis.shareExpiresAt = null;
    await analysis.save();
    return res.status(200).json({ success: true, message: 'Share link revoked.' });
  } catch (error) {
    return next(error);
  }
};

const getSharedAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({
      shareToken: req.params.token,
      $or: [{ shareExpiresAt: null }, { shareExpiresAt: { $gt: new Date() } }]
    }).select('+shareToken');
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'This shared report link is invalid, revoked, or expired.' });
    }
    return res.status(200).json({
      success: true,
      data: {
        jobTitle: analysis.jobTitle || 'Target Position',
        mode: analysis.mode,
        createdAt: analysis.createdAt,
        parseability: analysis.parseability?.length ? analysis.parseability : checkParseability(analysis.resumeText),
        result: {
          overallScore: analysis.result?.overallScore,
          breakdown: analysis.result?.breakdown,
          matchedKeywords: analysis.result?.matchedKeywords,
          missingKeywords: analysis.result?.missingKeywords,
          strengths: analysis.result?.strengths,
          suggestions: analysis.result?.suggestions,
          summary: analysis.result?.summary
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Delete analysis by ID
 * @route   DELETE /api/analyses/:id
 * @access  Private
 */
const deleteAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findById(req.params.id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found.'
      });
    }

    // Security check: user must own the analysis
    if (analysis.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this analysis record.'
      });
    }

    await Analysis.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Analysis record deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAnalysis,
  createAnalysisFromText,
  getAnalyses,
  getAnalysisById,
  deleteAnalysis,
  createShareLink,
  revokeShareLink,
  getSharedAnalysis
};
