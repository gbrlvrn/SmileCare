const { body, query } = require('express-validator');
const { toMinutes, TIME_REGEX } = require('../utils/time');
const {
  nameRule,
  emailRule,
  phoneRule,
  textRule,
  booleanRule,
  clinicTimeRule,
  dateRule,
  mongoIdRule,
  listQueryRules,
  booleanQueryRule,
} = require('./common');

const SPECIALIZATION_REGEX = /^[\p{L}\p{M} &()/,.'-]+$/u;

const specializationRule = (required) => {
  const chain = required
    ? body('specialization').exists({ values: 'falsy' }).withMessage('Specialization is required').bail()
    : body('specialization').optional();
  return chain
    .isString()
    .withMessage('Specialization must be text')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Specialization is required')
    .bail()
    .isLength({ max: 100 })
    .withMessage('Specialization must be at most 100 characters')
    .matches(SPECIALIZATION_REGEX)
    .withMessage('Specialization contains invalid characters');
};

const workingDaysRules = (required) => [
  (required ? body('workingDays').exists().withMessage('Working days are required').bail() : body('workingDays').optional())
    .isArray({ min: 1, max: 6 })
    .withMessage('Select at least one working day'),
  body('workingDays.*')
    .isInt({ min: 1, max: 6 })
    .withMessage('Working days must be from 1 (Monday) to 6 (Saturday); the clinic is closed on Sunday')
    .toInt(),
];

// When both times are sent, endTime must be after startTime.
// (Partial updates are re-checked in the controller against the stored values.)
const endAfterStart = body('endTime')
  .optional()
  .custom((value, { req }) => {
    const { startTime } = req.body;
    if (!TIME_REGEX.test(String(value)) || !TIME_REGEX.test(String(startTime))) return true; // format errors reported elsewhere
    return toMinutes(value) > toMinutes(startTime);
  })
  .withMessage('End time must be after start time');

const listDentistsRules = [...listQueryRules, booleanQueryRule('all')];

const createDentistRules = [
  nameRule('firstName', 'First name'),
  nameRule('lastName', 'Last name'),
  specializationRule(true),
  emailRule('email', { required: false }),
  phoneRule(),
  textRule('bio', 'Bio', 1000),
  ...workingDaysRules(true),
  clinicTimeRule(body('startTime'), 'Start time'),
  clinicTimeRule(body('endTime'), 'End time'),
  endAfterStart,
  booleanRule('isActive', 'isActive'),
];

const updateDentistRules = [
  nameRule('firstName', 'First name', { required: false }),
  nameRule('lastName', 'Last name', { required: false }),
  specializationRule(false),
  emailRule('email', { required: false }),
  phoneRule(),
  textRule('bio', 'Bio', 1000),
  ...workingDaysRules(false),
  clinicTimeRule(body('startTime'), 'Start time', { required: false }),
  clinicTimeRule(body('endTime'), 'End time', { required: false }),
  endAfterStart,
  booleanRule('isActive', 'isActive'),
];

const availabilityRules = [
  dateRule(query('date'), 'Date'),
  mongoIdRule(query('serviceId'), 'Service'),
  mongoIdRule(query('excludeAppointmentId'), 'Appointment', { required: false }),
];

module.exports = { listDentistsRules, createDentistRules, updateDentistRules, availabilityRules };
