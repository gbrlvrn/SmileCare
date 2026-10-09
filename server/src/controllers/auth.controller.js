const crypto = require('crypto');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { sendSuccess, pick } = require('../utils/response');
const { ROLES } = require('../config/constants');
const { sendOtpEmail } = require('../services/email.service');

/**
 * POST /api/auth/register-request-otp
 * Validates registration data, checks email uniqueness, stores pending registration in MongoDB,
 * and sends a 6-digit verification code to the recipient's email.
 */
const requestRegistrationOtp = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['firstName', 'lastName', 'email', 'password', 'phone', 'address', 'dateOfBirth', 'gender']);
  const cleanEmail = data.email.toLowerCase().trim();

  if (await User.exists({ email: cleanEmail })) {
    throw ApiError.conflict('Email is already registered');
  }

  // Generate a random 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Upsert pending registration in MongoDB (stateless across Vercel / serverless deployments)
  await PendingRegistration.findOneAndUpdate(
    { email: cleanEmail },
    {
      email: cleanEmail,
      otp,
      userData: { ...data, email: cleanEmail },
      attempts: 0,
      expiresAt,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Send branded OTP email
  await sendOtpEmail({
    to: cleanEmail,
    firstName: data.firstName,
    otp,
    expiresInMinutes: 10,
  });

  sendSuccess(
    res,
    {
      email: cleanEmail,
      expiresIn: 600,
    },
    {
      message: 'A 6-digit verification code has been sent to your email.',
    }
  );
});

/**
 * POST /api/auth/verify-registration-otp
 * Validates the 6-digit OTP from MongoDB. On success, creates the user account and returns JWT.
 */
const verifyRegistrationOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanOtp = String(otp || '').trim();

  const pending = await PendingRegistration.findOne({ email: cleanEmail });

  if (!pending || pending.expiresAt < new Date()) {
    throw ApiError.badRequest('Verification code has expired or was not requested. Please sign up again.');
  }

  if (pending.attempts >= 5) {
    throw ApiError.badRequest('Too many failed attempts. Please request a new verification code.');
  }

  if (pending.otp !== cleanOtp) {
    pending.attempts += 1;
    await pending.save();
    const remaining = Math.max(0, 5 - pending.attempts);
    throw ApiError.badRequest(
      `Invalid verification code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Please request a new code.'}`
    );
  }

  // Ensure email wasn't taken while user was typing OTP
  if (await User.exists({ email: cleanEmail })) {
    await PendingRegistration.deleteOne({ _id: pending._id });
    throw ApiError.conflict('Email is already registered');
  }

  // Create patient user record (password is automatically hashed via User pre-save hook)
  const user = await User.create({
    ...pending.userData,
    role: ROLES.PATIENT,
  });

  // Remove pending registration record
  await PendingRegistration.deleteOne({ _id: pending._id });

  sendSuccess(
    res,
    {
      token: generateToken(user),
      user,
    },
    {
      status: 201,
      message: 'Account created successfully!',
    }
  );
});

/**
 * POST /api/auth/resend-registration-otp
 * Resends a new 6-digit OTP code to the email with a 30-second cooldown protection.
 */
const resendRegistrationOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const cleanEmail = String(email || '').trim().toLowerCase();

  const pending = await PendingRegistration.findOne({ email: cleanEmail });
  if (!pending) {
    throw ApiError.badRequest('No pending registration found for this email. Please sign up again.');
  }

  // Cooldown check (30 seconds)
  const secondsSinceUpdate = (Date.now() - new Date(pending.updatedAt).getTime()) / 1000;
  if (secondsSinceUpdate < 30) {
    const waitTime = Math.ceil(30 - secondsSinceUpdate);
    throw ApiError.badRequest(`Please wait ${waitTime} second(s) before requesting another code.`);
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  pending.otp = otp;
  pending.attempts = 0;
  pending.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await pending.save();

  await sendOtpEmail({
    to: cleanEmail,
    firstName: pending.userData.firstName,
    otp,
    expiresInMinutes: 10,
  });

  sendSuccess(
    res,
    {
      email: cleanEmail,
      expiresIn: 600,
    },
    {
      message: 'A new 6-digit verification code has been sent to your email.',
    }
  );
});

/**
 * POST /api/auth/register
 * Legacy direct public sign-up. The role is ALWAYS "patient".
 */
const register = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['firstName', 'lastName', 'email', 'password', 'phone', 'address', 'dateOfBirth', 'gender']);

  if (await User.exists({ email: data.email })) {
    throw ApiError.conflict('Email is already registered');
  }

  const user = await User.create({ ...data, role: ROLES.PATIENT });

  sendSuccess(res, { token: generateToken(user), user }, { status: 201, message: 'Registration successful' });
});

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 60 * 1000; // 60 seconds lockout
const FAILED_ATTEMPTS_EXPIRY_MS = 15 * 60 * 1000; // Reset rolling failed attempts after 15 min

/**
 * POST /api/auth/login
 * Validates credentials, checks 5-attempt limit / 60s lockout, and returns JWT token + user profile.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = String(email || '').trim().toLowerCase();

  const user = await User.findOne({ email: cleanEmail }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Account not registered');
  }

  const now = Date.now();

  // 1. Check if the account is currently locked
  if (user.lockUntil && user.lockUntil.getTime() > now) {
    const remainingSeconds = Math.max(1, Math.ceil((user.lockUntil.getTime() - now) / 1000));
    throw ApiError.locked(
      `Account is temporarily locked due to ${MAX_LOGIN_ATTEMPTS} failed login attempts. Please try again in ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}.`,
      remainingSeconds
    );
  }

  // 2. If the lockout has expired, clear the lock and reset the counter
  if (user.lockUntil && user.lockUntil.getTime() <= now) {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
  } else if (
    user.lastFailedLogin &&
    now - user.lastFailedLogin.getTime() > FAILED_ATTEMPTS_EXPIRY_MS
  ) {
    // Stale failed attempts from earlier are cleared
    user.failedLoginAttempts = 0;
  }

  // 3. Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    user.lastFailedLogin = new Date();

    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(now + LOCK_TIME_MS);
      await user.save();
      throw ApiError.locked(
        'Too many failed login attempts. Your account has been temporarily locked for 60 seconds.',
        60
      );
    }

    await user.save();
    const attemptsLeft = MAX_LOGIN_ATTEMPTS - user.failedLoginAttempts;
    throw new ApiError(
      401,
      `Incorrect password. You have ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before your account is locked.`
    );
  }

  // 4. Successful login: reset failed attempts & lock status
  if (user.failedLoginAttempts > 0 || user.lockUntil || user.lastFailedLogin) {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastFailedLogin = null;
    await user.save();
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

module.exports = {
  requestRegistrationOtp,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  register,
  login,
  getMe,
  logout,
};
