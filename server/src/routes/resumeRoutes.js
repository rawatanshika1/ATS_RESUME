const express = require('express');
const {
  createResume,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume
} = require('../controllers/resumeController');
const { generateResumeAi } = require('../controllers/resumeAiController');
const { protect } = require('../middleware/authMiddleware');
const { resumeAiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);

router.post('/ai', resumeAiRateLimiter, generateResumeAi);

router.route('/')
  .post(createResume)
  .get(getResumes);

router.route('/:id')
  .get(getResumeById)
  .put(updateResume)
  .patch(updateResume)
  .delete(deleteResume);

module.exports = router;
