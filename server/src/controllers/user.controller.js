const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, pick } = require('../utils/response');
const { ROLES } = require('../config/constants');

// Whitelist: role, email, isActive and password can never be changed through this endpoint.
const PROFILE_FIELDS = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'address'];

/** PUT /api/users/me — update own profile. */
const updateProfile = asyncHandler(async (req, res) => {
  const fields = req.user.role === ROLES.PATIENT ? [...PROFILE_FIELDS, 'medicalNotes'] : PROFILE_FIELDS;

  Object.assign(req.user, pick(req.body, fields));
  await req.user.save();

  sendSuccess(res, req.user, { message: 'Profile updated successfully' });
});

/** PUT /api/users/me/password — requires the current password. */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword; // hashed by the pre-save hook
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  user.lastFailedLogin = null;
  await user.save();

  sendSuccess(res, null, { message: 'Password changed successfully' });
});

module.exports = { updateProfile, changePassword };
