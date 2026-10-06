const { rateLimit } = require('express-rate-limit');

const FIFTEEN_MINUTES = 15 * 60 * 1000;

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
 * Strict limiter for login and register (brute-force / credential-stuffing protection):
 * 10 attempts per 15 minutes per IP, shared by both routes.
 * AUTH_RATE_LIMIT_MAX can raise the limit for local development only.
 */
const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login or registration attempts. Please try again in 15 minutes.',
  },
});

module.exports = { apiLimiter, authLimiter };
