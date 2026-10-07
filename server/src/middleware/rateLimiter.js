const rateLimit = require('express-rate-limit');

// Rate limiter for AI analysis endpoint to prevent abuse
const analysisRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 analysis requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many resume analysis requests from this IP. Please try again after 15 minutes.'
  }
});

const resumeAiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI writing requests from this IP. Please try again after 15 minutes.'
  }
});

module.exports = { analysisRateLimiter, resumeAiRateLimiter };
