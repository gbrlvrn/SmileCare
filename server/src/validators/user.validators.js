const { body } = require('express-validator');
const {
  nameRule,
  phoneRule,
  dateOfBirthRule,
  genderRule,
  textRule,
  passwordRule,
  confirmPasswordRule,
} = require('./common');

// email, role, isActive and password are NOT accepted here (ignored by the controller).
const updateProfileRules = [
  nameRule('firstName', 'First name', { required: false }),
  nameRule('lastName', 'Last name', { required: false }),
  phoneRule(),
  dateOfBirthRule(),
  genderRule(),
  textRule('address', 'Address', 200),
  textRule('medicalNotes', 'Medical notes', 500),
];

const changePasswordRules = [
  body('currentPassword')
    .exists({ values: 'falsy' })
    .withMessage('Current password is required')
    .bail()
    .isString()
    .withMessage('Current password must be text'),
  passwordRule('newPassword', 'New password')
    .bail()
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('New password must be different from the current password'),
  confirmPasswordRule('confirmPassword', 'newPassword'),
];

module.exports = { updateProfileRules, changePasswordRules };
