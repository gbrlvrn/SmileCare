const { body } = require('express-validator');
const {
  nameRule,
  emailRule,
  passwordRule,
  confirmPasswordRule,
  phoneRule,
  dateOfBirthRule,
  genderRule,
} = require('./common');

const registerRules = [
  nameRule('firstName', 'First name'),
  nameRule('lastName', 'Last name'),
  emailRule(),
  passwordRule(),
  confirmPasswordRule('confirmPassword', 'password'),
  phoneRule(),
  dateOfBirthRule(),
  genderRule(),
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

module.exports = { registerRules, loginRules };
