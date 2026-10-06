const ApiError = require('../utils/ApiError');

// Friendly messages for duplicate-key (E11000) errors, by field.
const DUPLICATE_MESSAGES = {
  email: 'Email is already registered',
  name: 'A service with this name already exists',
  dentist: 'This time slot is already booked',
};

/** 404 for any route that did not match. */
function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Converts known library errors into an ApiError with the right status code. */
function normalizeError(err) {
  if (err instanceof ApiError) return err;

  // Invalid ObjectId (or other cast failure) -> the resource cannot exist
  if (err.name === 'CastError') return ApiError.notFound('Resource not found');

  // Unique index violation
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    return ApiError.conflict(DUPLICATE_MESSAGES[field] || 'Duplicate value');
  }

  // Mongoose schema validation
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new ApiError(422, 'Validation failed', errors);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Not authorized, invalid token');
  }

  // body-parser errors
  if (err.type === 'entity.parse.failed') return ApiError.badRequest('Malformed JSON in request body');
  if (err.type === 'entity.too.large') return new ApiError(413, 'Request body is too large');

  return null; // unknown -> 500
}

/**
 * Central error handler: every error ends up here and is sent using the
 * standard envelope { success: false, message, errors? }.
 * Stack traces and internal messages are never exposed in production.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';
  const apiError = normalizeError(err);

  if (!apiError) {
    console.error(err);
    const body = { success: false, message: isProduction ? 'Server error' : err.message || 'Server error' };
    if (!isProduction) body.stack = err.stack;
    return res.status(500).json(body);
  }

  const body = { success: false, message: apiError.message };
  if (apiError.errors) body.errors = apiError.errors;
  return res.status(apiError.statusCode).json(body);
}

module.exports = { notFound, errorHandler };
