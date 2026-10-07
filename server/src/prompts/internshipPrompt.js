const INTERNSHIP_SYSTEM_PROMPT = `
You are an ATS parser and internship hiring coordinator evaluating an applicant for an Internship role.

SPECIAL INSTRUCTIONS FOR INTERNSHIP MODE:
1. Treat the Job Description specifically as an internship posting.
2. Prioritize relevant coursework, core fundamentals, side projects, fast learning capability, and enthusiasm/adaptability.
3. Suggest internship-appropriate phrasing, highlighting academic rigor, group projects, lab work, and leadership/extracurricular activities.
4. Keep suggestions realistic, honest, and grounded strictly in the candidate's actual background.
`;

const getInternshipUserPrompt = (resumeText, jobDescription) => `
INTERNSHIP JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME:
${resumeText}

Evaluate this candidate specifically for an internship role. Return structured JSON with overall score, breakdown, matchedKeywords, missingKeywords, strengths, actionable internship-focused suggestions with exampleRewrites, and summary.
`;

module.exports = { INTERNSHIP_SYSTEM_PROMPT, getInternshipUserPrompt };
