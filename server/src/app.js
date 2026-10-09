const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Behind Render's proxy, trust the first hop so rate limiting sees the real client IP.
if (isProduction) app.set('trust proxy', 1);

// 1. Secure HTTP headers (CSP, X-Content-Type-Options, HSTS, ...)
app.use(helmet());

const connectDB = require('./config/db');

// 2. CORS: allow configured origins, localhost in dev, and *.vercel.app in production
const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);

  if (!isProduction) {
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
  } else {
    try {
      const parsed = new URL(origin);
      if (
        configuredOrigins.includes(origin) ||
        configuredOrigins.some((o) => origin.startsWith(o)) ||
        parsed.hostname.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }
  return callback(new Error('Not allowed by CORS'));
};

app.use(cors({ origin: corsOrigin, credentials: false }));

// Ensure database connection for serverless / Vercel lambdas
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// 3. Parse JSON bodies (up to 10mb for avatar/photo uploads).
app.use(express.json({ limit: '10mb' }));

// 4. Strip keys starting with "$" or containing "." (NoSQL operator injection).
app.use(mongoSanitize());

// 5. Request logging in development only.
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// 6. General rate limit for the whole API.
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api', routes);

// 7. Unknown routes and central error handling (must be last).
app.use(notFound);
app.use(errorHandler);

module.exports = app;
