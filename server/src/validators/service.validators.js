const { body } = require('express-validator');
const { SERVICE_DURATIONS } = require('../config/constants');
const { textRule, booleanRule, listQueryRules, booleanQueryRule } = require('./common');

const SERVICE_NAME_REGEX = /^[\p{L}\p{M}\p{N} &()/,.'+-]+$/u;

const nameRule = (required) => {
  const chain = required
    ? body('name').exists({ values: 'falsy' }).withMessage('Service name is required').bail()
    : body('name').optional();
  return chain
    .isString()
    .withMessage('Service name must be text')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Service name is required')
    .bail()
    .isLength({ max: 100 })
    .withMessage('Service name must be at most 100 characters')
    .matches(SERVICE_NAME_REGEX)
    .withMessage('Service name contains invalid characters');
};

const durationRule = (required) =>
  (required
    ? body('durationMinutes').exists({ values: 'null' }).withMessage('Duration is required').bail()
    : body('durationMinutes').optional()
  )
    .isInt()
    .withMessage('Duration must be a number')
    .bail()
    .toInt()
    .isIn(SERVICE_DURATIONS)
    .withMessage('Duration must be 30, 60, 90 or 120 minutes');

const priceRule = (required) =>
  (required ? body('price').exists({ values: 'null' }).withMessage('Price is required').bail() : body('price').optional())
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Price must be a number between 0 and 1,000,000')
    .toFloat();

const listServicesRules = [...listQueryRules, booleanQueryRule('all')];

const createServiceRules = [
  nameRule(true),
  textRule('description', 'Description', 500),
  durationRule(true),
  priceRule(true),
  booleanRule('isActive', 'isActive'),
];

const updateServiceRules = [
  nameRule(false),
  textRule('description', 'Description', 500),
  durationRule(false),
  priceRule(false),
  booleanRule('isActive', 'isActive'),
];

module.exports = { listServicesRules, createServiceRules, updateServiceRules };
