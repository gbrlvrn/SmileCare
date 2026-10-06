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

// 2. CORS: only our frontend origin(s) may call the API from a browser.
//    CLIENT_URL may be a comma-separated list (e.g. local + deployed URLs).
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: false }));

// 3. Parse JSON bodies, rejecting anything larger than 10 kb.
app.use(express.json({ limit: '10kb' }));

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
