const mongoose = require('mongoose');
const Resume = require('../models/Resume');

const sectionFields = [
  'personalInfo',
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
  'certifications'
];

const isPlainObject = (value) => (
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
);

const badRequest = (res, message) => res.status(400).json({ success: false, message });

const validateResumePayload = (body, { partial = false } = {}) => {
  if (!isPlainObject(body)) return 'Request body must be a JSON object.';

  const allowedFields = ['title', 'templateId', 'sections'];
  const unknownField = Object.keys(body).find((field) => !allowedFields.includes(field));
  if (unknownField) return `Unsupported resume field: ${unknownField}.`;

  if (!partial || Object.prototype.hasOwnProperty.call(body, 'title')) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 120) {
      return 'Title is required and must be no longer than 120 characters.';
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, 'templateId')) {
    if (typeof body.templateId !== 'string' || !body.templateId.trim() || body.templateId.trim().length > 100) {
      return 'Template ID is required and must be no longer than 100 characters.';
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'sections')) {
    if (!isPlainObject(body.sections)) return 'Sections must be an object.';

    const unknownSection = Object.keys(body.sections).find((field) => !sectionFields.includes(field));
    if (unknownSection) return `Unsupported resume section: ${unknownSection}.`;

    const { sections } = body;
    if (Object.prototype.hasOwnProperty.call(sections, 'personalInfo') && !isPlainObject(sections.personalInfo)) {
      return 'Personal information must be an object.';
    }
    if (Object.prototype.hasOwnProperty.call(sections, 'summary') &&
        (typeof sections.summary !== 'string' || sections.summary.length > 5000)) {
      return 'Summary must be a string of no more than 5000 characters.';
    }
    if (Object.prototype.hasOwnProperty.call(sections, 'skills') &&
        (!Array.isArray(sections.skills) || sections.skills.length > 100 ||
         sections.skills.some((item) => typeof item !== 'string' && !isPlainObject(item)))) {
      return 'Skills must be an array of up to 100 strings or objects.';
    }

    for (const field of ['experience', 'projects', 'education', 'certifications']) {
      if (Object.prototype.hasOwnProperty.call(sections, field) &&
          (!Array.isArray(sections[field]) || sections[field].length > 50 ||
           sections[field].some((item) => !isPlainObject(item)))) {
        return `${field} must be an array of up to 50 objects.`;
      }
    }
  }

  if (partial && Object.keys(body).length === 0) return 'Provide at least one field to update.';
  return null;
};

const handleValidationError = (error, res, next) => {
  if (error instanceof mongoose.Error.ValidationError) {
    return badRequest(res, Object.values(error.errors).map((item) => item.message).join(', '));
  }
  return next(error);
};

const createResume = async (req, res, next) => {
  const validationMessage = validateResumePayload(req.body);
  if (validationMessage) return badRequest(res, validationMessage);

  try {
    const resume = await Resume.create({
      userId: req.user._id,
      title: req.body.title,
      templateId: req.body.templateId,
      sections: req.body.sections || {}
    });
    return res.status(201).json({ success: true, data: resume });
  } catch (error) {
    return handleValidationError(error, res, next);
  }
};

const getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, count: resumes.length, data: resumes });
  } catch (error) {
    return next(error);
  }
};

const getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });
    return res.status(200).json({ success: true, data: resume });
  } catch (error) {
    return next(error);
  }
};

const updateResume = async (req, res, next) => {
  const validationMessage = validateResumePayload(req.body, { partial: true });
  if (validationMessage) return badRequest(res, validationMessage);

  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });

    if (Object.prototype.hasOwnProperty.call(req.body, 'title')) resume.title = req.body.title;
    if (Object.prototype.hasOwnProperty.call(req.body, 'templateId')) resume.templateId = req.body.templateId;
    if (Object.prototype.hasOwnProperty.call(req.body, 'sections')) {
      for (const [field, value] of Object.entries(req.body.sections)) {
        resume.set(`sections.${field}`, value);
      }
    }

    await resume.save();
    return res.status(200).json({ success: true, data: resume });
  } catch (error) {
    return handleValidationError(error, res, next);
  }
};

const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });
    return res.status(200).json({ success: true, message: 'Resume deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createResume,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume
};
