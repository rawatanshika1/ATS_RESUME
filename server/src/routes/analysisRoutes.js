const express = require('express');
const router = express.Router();
const {
  createAnalysis,
  createAnalysisFromText,
  getAnalyses,
  getAnalysisById,
  deleteAnalysis,
  createShareLink,
  revokeShareLink,
  getSharedAnalysis
} = require('../controllers/analysisController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { analysisRateLimiter } = require('../middleware/rateLimiter');

router.get('/shared/:token', getSharedAnalysis);

// All remaining analysis routes require authentication
router.use(protect);

router.post('/text', analysisRateLimiter, createAnalysisFromText);
router.post('/', analysisRateLimiter, upload.single('resume'), createAnalysis);
router.get('/', getAnalyses);
router.post('/:id/share', createShareLink);
router.delete('/:id/share', revokeShareLink);
router.get('/:id', getAnalysisById);
router.delete('/:id', deleteAnalysis);

module.exports = router;
