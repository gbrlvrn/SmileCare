const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { sendSuccess, pick } = require('../utils/response');
const { ROLES } = require('../config/constants');

/**
 * POST /api/auth/register
 * Public sign-up. The role is ALWAYS "patient" (staff accounts are created by staff),
 * so a client cannot register itself as staff by sending { role: 'staff' }.
 */
const register = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['firstName', 'lastName', 'email', 'password', 'phone', 'dateOfBirth', 'gender']);

  if (await User.exists({ email: data.email })) {
    throw ApiError.conflict('Email is already registered');
  }

  const user = await User.create({ ...data, role: ROLES.PATIENT });

  sendSuccess(res, { token: generateToken(user), user }, { status: 201, message: 'Registration successful' });
});

/**
 * POST /api/auth/login
 * Uses one generic message for unknown email and wrong password so attackers
 * cannot discover which emails are registered.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.unauthorized('Account is deactivated. Please contact the clinic.');
  }

  sendSuccess(res, { token: generateToken(user), user }, { message: 'Login successful' });
});

/** GET /api/auth/me — the logged-in user (used by the client on page refresh). */
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, req.user);
});

/** POST /api/auth/logout — JWTs are stateless; the client simply discards the token. */
const logout = asyncHandler(async (req, res) => {
  sendSuccess(res, null, { message: 'Logged out successfully' });
});

module.exports = { register, login, getMe, logout };
