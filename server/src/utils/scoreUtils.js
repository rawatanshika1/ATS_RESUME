/**
 * Utility functions for score clamping, validation, and safe JSON parsing.
 */

/**
 * Clamps a numerical score between 0 and 100 (inclusive).
 * Handles null/undefined/non-number values gracefully.
 */
function clampScore(val, defaultVal = 70) {
  if (val === null || val === undefined || isNaN(val)) {
    return defaultVal;
  }
  const num = Number(val);
  return Math.max(0, Math.min(100, Math.round(num)));
}

/**
 * Normalizes and clamps the entire Gemini analysis JSON object.
 */
function sanitizeAnalysisResult(data) {
  if (!data || typeof data !== 'object') {
    data = {};
  }

  const breakdown = data.breakdown || {};

  const sanitized = {
    overallScore: clampScore(data.overallScore, 75),
    breakdown: {
      keywordMatch: clampScore(breakdown.keywordMatch, 70),
      skillsMatch: clampScore(breakdown.skillsMatch, 75),
      experienceRelevance: clampScore(breakdown.experienceRelevance, 70),
      formatting: clampScore(breakdown.formatting, 80),
      education: clampScore(breakdown.education, 80)
    },
    matchedKeywords: Array.isArray(data.matchedKeywords) ? data.matchedKeywords.map(String) : [],
    missingKeywords: Array.isArray(data.missingKeywords)
      ? data.missingKeywords.map((item) => ({
          keyword: String(item.keyword || 'Required Skill'),
          importance: ['high', 'medium', 'low'].includes(String(item.importance).toLowerCase())
            ? String(item.importance).toLowerCase()
            : 'medium',
          whereToAdd: String(item.whereToAdd || 'Skills section or Experience bullets')
        }))
      : [],
    strengths: Array.isArray(data.strengths) ? data.strengths.map(String) : [],
    suggestions: Array.isArray(data.suggestions)
      ? data.suggestions.map((s) => ({
          section: String(s.section || 'General'),
          issue: String(s.issue || 'Opportunity for improvement'),
          improvement: String(s.improvement || 'Enhance bullet points with action verbs and quantifiable results.'),
          exampleRewrite: String(s.exampleRewrite || '')
        }))
      : [],
    summary: String(data.summary || 'Resume evaluated against job requirements.')
  };

  if (data.linkedinOptimization && typeof data.linkedinOptimization === 'object') {
    const li = data.linkedinOptimization;
    sanitized.linkedinOptimization = {
      headline: Array.isArray(li.headline) && li.headline.length > 0
        ? li.headline.map(String).slice(0, 3)
        : [
            'Results-Driven Professional | Software Engineering & Tech Solutions',
            'Full Stack Developer | Building Scalable Web & Cloud Applications',
            'Tech Specialist | Passionate about Innovation & Modern Engineering'
          ],
      aboutSection: String(li.aboutSection || 'Dedicated professional with a proven track record...'),
      skillsToAdd: Array.isArray(li.skillsToAdd) ? li.skillsToAdd.map(String) : []
    };
  }

  return sanitized;
}

/**
 * Safely parses JSON string with fallback cleaning
 */
function safeJsonParse(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    // Attempt markdown codeblock cleanup
    let cleaned = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/g, '').trim();
    return JSON.parse(cleaned);
  }
}

module.exports = {
  clampScore,
  sanitizeAnalysisResult,
  safeJsonParse
};
