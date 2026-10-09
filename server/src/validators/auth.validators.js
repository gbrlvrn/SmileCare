const { body } = require('express-validator');
const {
  nameRule,
  emailRule,
  passwordRule,
  confirmPasswordRule,
  phoneRule,
  textRule,
  dateOfBirthRule,
  genderRule,
} = require('./common');

const registerRules = [
  nameRule('firstName', 'First name'),
  nameRule('lastName', 'Last name'),
  emailRule(),
  passwordRule(),
  confirmPasswordRule('confirmPassword', 'password'),
  phoneRule('phone', { required: true }),
  textRule('address', 'Address', 200, { required: false }),
  dateOfBirthRule(),
  genderRule('gender', { required: true }),
];

// Login only checks presence/type: the password policy is not revealed here.
const loginRules = [
  emailRule(),
  body('password')
    .exists({ values: 'falsy' })
    .withMessage('Password is required')
    .bail()
    .isString()
    .withMessage('Password must be text'),
];

const verifyOtpRules = [
  emailRule(),
  body('otp')
    .exists({ values: 'falsy' })
    .withMessage('Verification code is required')
    .bail()
    .isString()
    .withMessage('Verification code must be text')
    .bail()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .matches(/^\d{6}$/)
    .withMessage('Verification code must contain 6 numbers'),
];

const resendOtpRules = [emailRule()];

module.exports = { registerRules, loginRules, verifyOtpRules, resendOtpRules };
