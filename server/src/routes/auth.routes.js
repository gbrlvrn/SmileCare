const express = require('express');
const {
  requestRegistrationOtp,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  register,
  login,
  getMe,
  logout,
} = require('../controllers/auth.controller');
const {
  registerRules,
  loginRules,
  verifyOtpRules,
  resendOtpRules,
} = require('../validators/auth.validators');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter, loginLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/register-request-otp', authLimiter, registerRules, validate, requestRegistrationOtp);
router.post('/verify-registration-otp', authLimiter, verifyOtpRules, validate, verifyRegistrationOtp);
router.post('/resend-registration-otp', authLimiter, resendOtpRules, validate, resendRegistrationOtp);

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', loginLimiter, loginRules, validate, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
