/**
 * Reusable express-validator rule builders shared by the resource validators.
 *
 * Conventions:
 * - Every field is type-checked with isString()/isInt()/... so objects such as
 *   { "$gt": "" } (NoSQL injection attempts) are rejected.
 * - Free text (reason, notes, bio, ...) is sanitized with stripTags (HTML tags and
 *   control characters removed, then trimmed) and length-checked. There is NO
 *   entity encoding: React escapes output when rendering, so "Patient's & co"
 *   round-trips unchanged.
 * - Optional fields accept "" (or null) to mean "clear this field".
 */
const { body, query } = require('express-validator');
const { GENDERS, CLINIC } = require('../config/constants');
const { DATE_REGEX, TIME_REGEX, isValidDateString, toMinutes, clinicNow } = require('../utils/time');

const NAME_REGEX = /^[\p{L}\p{M}' .-]+$/u;
const PHONE_REGEX = /^(09|\+639)\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,64}$/;

const PASSWORD_MESSAGE =
  'Password must be 8-64 characters and include an uppercase letter, a lowercase letter, a number and a symbol';

// Control characters except tab (\x09) and newline (\x0A), including null bytes.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B-\x1F\x7F]/g;

/**
 * Sanitizer for free text: removes HTML tags and control characters, then trims.
 *   "<b>hi</b>" -> "hi",  "<script>alert(1)</script>x" -> "alert(1)x"
 */
const stripTags = (value) =>
  typeof value === 'string' ? value.replace(/<[^>]*>/g, '').replace(CONTROL_CHARS_REGEX, '').trim() : value;

/** Starts a chain that is either required or optional ("" / null = not provided / clear). */
function start(chain, label, required) {
  return required
    ? chain.exists({ values: 'falsy' }).withMessage(`${label} is required`).bail()
    : chain.optional({ values: 'falsy' });
}

/** First/last name: letters, spaces, apostrophes, dots and hyphens. */
const nameRule = (field, label, { required = true } = {}) => {
  // Names may not be cleared on update, so an empty string is still validated.
  const chain = required
    ? body(field).exists({ values: 'falsy' }).withMessage(`${label} is required`).bail()
    : body(field).optional();
  return chain
    .isString()
    .withMessage(`${label} must be text`)
    .bail()
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .bail()
    .isLength({ max: 50 })
    .withMessage(`${label} must be at most 50 characters`)
    .matches(NAME_REGEX)
    .withMessage(`${label} can only contain letters, spaces, apostrophes, dots and hyphens`);
};

const emailRule = (field = 'email', { required = true } = {}) =>
  start(body(field), 'Email', required)
    .isString()
    .withMessage('Email must be text')
    .bail()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .bail()
    .isLength({ max: 100 })
    .withMessage('Email must be at most 100 characters')
    .toLowerCase();

const passwordRule = (field = 'password', label = 'Password', { required = true } = {}) =>
  start(body(field), label, required)
    .isString()
    .withMessage(`${label} must be text`)
    .bail()
    .matches(PASSWORD_REGEX)
    .withMessage(PASSWORD_MESSAGE);

const confirmPasswordRule = (field, matchField) =>
  body(field)
    .exists({ values: 'falsy' })
    .withMessage('Please confirm the password')
    .bail()
    .custom((value, { req }) => value === req.body[matchField])
    .withMessage('Passwords do not match');

const phoneRule = (field = 'phone', { required = false } = {}) => {
  let chain = body(field);
  if (required) {
    chain = chain.exists({ values: 'falsy' }).withMessage('Mobile number is required').bail();
  } else {
    chain = chain.optional({ values: 'falsy' });
  }
  return chain
    .isString()
    .withMessage('Phone must be text')
    .bail()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage('Phone must be a valid PH mobile number (e.g. 09171234567)');
};

/** A "YYYY-MM-DD" date that exists on the calendar. */
const isDate = (value) => typeof value === 'string' && DATE_REGEX.test(value) && isValidDateString(value);

const dateOfBirthRule = (field = 'dateOfBirth') =>
  body(field)
    .optional({ values: 'falsy' })
    .custom(isDate)
    .withMessage('Date of birth must be a valid date (YYYY-MM-DD)')
    .bail()
    .custom((value) => value >= '1900-01-01' && value <= clinicNow().date)
    .withMessage('Date of birth cannot be in the future');

const genderRule = (field = 'gender', { required = false } = {}) => {
  let chain = body(field);
  if (required) {
    chain = chain.exists({ values: 'falsy' }).withMessage('Gender is required').bail();
  } else {
    chain = chain.optional({ values: 'falsy' });
  }
  return chain
    .isIn(GENDERS)
    .withMessage(`Gender must be one of: ${GENDERS.join(', ')}`);
};

/**
 * Free-text field: HTML tags and control characters stripped, trimmed, length-checked.
 * XSS defence = tag stripping here + React auto-escaping on output + Helmet headers.
 */
const textRule = (field, label, max, { required = false } = {}) => {
  let chain = start(body(field), label, required)
    .isString()
    .withMessage(`${label} must be text`)
    .bail()
    .customSanitizer(stripTags);
  // A required field that was only tags/whitespace (e.g. "<b></b>") is now empty.
  if (required) chain = chain.notEmpty().withMessage(`${label} is required`).bail();
  return chain.isLength({ max }).withMessage(`${label} must be at most ${max} characters`);
};

const booleanRule = (field, label) =>
  body(field).optional().isBoolean().withMessage(`${label} must be true or false`).bail().toBoolean();

/** A clinic time "HH:mm" on a 30-minute boundary, inside clinic opening hours. */
const clinicTimeRule = (chain, label, { required = true } = {}) =>
  start(chain, label, required)
    .matches(TIME_REGEX)
    .withMessage(`${label} must be in HH:mm format`)
    .bail()
    .custom((value) => toMinutes(value) % CLINIC.slotMinutes === 0)
    .withMessage(`${label} must be on a 30-minute boundary (e.g. 09:00, 09:30)`)
    .bail()
    .custom((value) => value >= CLINIC.openTime && value <= CLINIC.closeTime)
    .withMessage(`${label} must be within clinic hours (${CLINIC.openTime}-${CLINIC.closeTime})`);

const dateRule = (chain, label, { required = true } = {}) =>
  start(chain, label, required).custom(isDate).withMessage(`${label} must be a valid date (YYYY-MM-DD)`);

const mongoIdRule = (chain, label, { required = true } = {}) =>
  start(chain, label, required).isMongoId().withMessage(`Invalid ${label.toLowerCase()} id`);

/** page / limit / search / sort, accepted by every list endpoint. */
const listQueryRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer').toInt(),
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be text')
    .bail()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search must be at most 100 characters'),
  query('sort')
    .optional()
    .isString()
    .bail()
    .matches(/^-?[A-Za-z]+$/)
    .withMessage('Invalid sort field'),
];

const booleanQueryRule = (field) =>
  query(field).optional().isIn(['true', 'false']).withMessage(`${field} must be true or false`);

module.exports = {
  nameRule,
  emailRule,
  passwordRule,
  confirmPasswordRule,
  phoneRule,
  dateOfBirthRule,
  genderRule,
  textRule,
  booleanRule,
  clinicTimeRule,
  dateRule,
  mongoIdRule,
  listQueryRules,
  booleanQueryRule,
  stripTags,
};
