const express = require('express');
const { register, login, getMe, logout } = require('../controllers/auth.controller');
const { registerRules, loginRules } = require('../validators/auth.validators');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
