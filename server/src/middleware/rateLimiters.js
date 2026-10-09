const { rateLimit } = require('express-rate-limit');

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const ONE_MINUTE = 60 * 1000;

/**
 * General limiter for every /api request: 300 requests per 15 minutes per IP.
 */
const apiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

/**
 * Strict limiter for registration and OTP routes:
 * 10 attempts per 15 minutes per IP.
 * AUTH_RATE_LIMIT_MAX can raise the limit for local development only.
 */
const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
});

/**
 * Strict limiter specifically for login:
 * 5 attempts per 60 seconds per IP (brute-force protection).
 * LOGIN_RATE_LIMIT_MAX can raise the limit for local development.
 */
const loginLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || ONE_MINUTE,
  limit: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please wait 60 seconds before trying again.',
    retryAfter: 60,
  },
});

module.exports = { apiLimiter, authLimiter, loginLimiter };
