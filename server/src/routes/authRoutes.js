const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  registerSchema,
  loginSchema
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.get('/me', protect, getMe);

module.exports = router;
