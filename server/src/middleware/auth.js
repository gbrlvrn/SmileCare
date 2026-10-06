const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

/** Extracts the token from an "Authorization: Bearer <token>" header. */
function getBearerToken(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

/** Verifies a JWT and loads the matching user (or throws a 401 ApiError). */
async function userFromToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Not authorized, invalid token';
    throw ApiError.unauthorized(message);
  }

  if (!payload || !OBJECT_ID_REGEX.test(String(payload.id))) {
    throw ApiError.unauthorized('Not authorized, invalid token');
  }

  const user = await User.findById(payload.id);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (!user.isActive) throw ApiError.unauthorized('Account is deactivated');
  return user;
}

/**
 * protect: the request must carry a valid JWT of an existing, active user.
 * The user document is attached as req.user for the next handlers.
 */
const protect = asyncHandler(async (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) throw ApiError.unauthorized('Not authorized, no token');

  req.user = await userFromToken(token);
  next();
});

/**
 * optionalAuth: like protect, but never rejects. Used on public endpoints
 * that show extra data to staff (e.g. inactive services with ?all=true).
 */
const optionalAuth = async (req, res, next) => {
  const token = getBearerToken(req);
  if (token) {
    try {
      req.user = await userFromToken(token);
    } catch {
      // Invalid token on a public route: continue as an anonymous visitor.
    }
  }
  next();
};

/** authorize('staff'): the logged-in user must have one of the given roles (403 otherwise). */
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    return next();
  };

module.exports = { protect, optionalAuth, authorize };
