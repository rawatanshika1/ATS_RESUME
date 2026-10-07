const { generateResumeAiContent } = require('../services/resumeAiService');

const actions = ['improveBullet', 'tailor', 'coverLetter', 'interviewQuestions', 'skillRoadmap'];
const tones = ['formal', 'friendly', 'concise'];

const generateResumeAi = async (req, res, next) => {
  const body = req.body || {};
  const unsupportedField = Object.keys(body).find((field) =>
    !['action', 'resumeText', 'jobDescription', 'bullet', 'tone'].includes(field));
  if (unsupportedField) {
    return res.status(400).json({ success: false, message: `Unsupported AI request field: ${unsupportedField}.` });
  }
  if (typeof body.action !== 'string' || !actions.includes(body.action)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid resume AI action.' });
  }
  if (typeof body.resumeText !== 'string' || !body.resumeText.trim() || body.resumeText.trim().length > 100000) {
    return res.status(400).json({ success: false, message: 'Resume text must contain between 1 and 100000 characters.' });
  }

  const requiresJobDescription = body.action !== 'improveBullet';
  if (requiresJobDescription &&
      (typeof body.jobDescription !== 'string' || body.jobDescription.trim().length < 20 ||
       body.jobDescription.trim().length > 20000)) {
    return res.status(400).json({ success: false, message: 'Please provide a job description between 20 and 20000 characters.' });
  }
  if (!requiresJobDescription && body.jobDescription !== undefined &&
      (typeof body.jobDescription !== 'string' || body.jobDescription.length > 20000)) {
    return res.status(400).json({ success: false, message: 'Job description must be a string of no more than 20000 characters.' });
  }
  if (body.action === 'improveBullet' &&
      (typeof body.bullet !== 'string' || !body.bullet.trim() || body.bullet.trim().length > 3000)) {
    return res.status(400).json({ success: false, message: 'Select a bullet containing between 1 and 3000 characters.' });
  }
  if (body.action === 'coverLetter' && !tones.includes(body.tone)) {
    return res.status(400).json({ success: false, message: 'Please select a valid cover letter tone.' });
  }
  if (body.action !== 'coverLetter' && body.tone !== undefined) {
    return res.status(400).json({ success: false, message: 'Tone is only supported for cover letter generation.' });
  }

  try {
    const data = await generateResumeAiContent(body.action, {
      resumeText: body.resumeText.trim(),
      jobDescription: typeof body.jobDescription === 'string' ? body.jobDescription.trim() : '',
      bullet: typeof body.bullet === 'string' ? body.bullet.trim() : '',
      tone: body.tone
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

module.exports = { generateResumeAi };
