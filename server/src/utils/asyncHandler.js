/**
 * Wraps an async route handler so rejected promises are forwarded to next(),
 * which sends them to the central error handler (Express 4 does not do this itself).
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
