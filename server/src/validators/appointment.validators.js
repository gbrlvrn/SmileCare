const { body, query } = require('express-validator');
const { APPOINTMENT_STATUSES } = require('../config/constants');
const { TIME_REGEX } = require('../utils/time');
const { textRule, dateRule, mongoIdRule, listQueryRules, booleanQueryRule } = require('./common');

// Only the format is validated here (422). Business rules such as the
// 30-minute boundary or working hours are checked by the booking service (400).
const startTimeRule = (required) =>
  (required
    ? body('startTime').exists({ values: 'falsy' }).withMessage('Start time is required').bail()
    : body('startTime').optional()
  )
    .matches(TIME_REGEX)
    .withMessage('Start time must be in HH:mm format');

const listAppointmentsRules = [
  ...listQueryRules,
  query('status').optional().isIn(APPOINTMENT_STATUSES).withMessage('Invalid status'),
  mongoIdRule(query('dentist'), 'Dentist', { required: false }),
  dateRule(query('from'), 'From date', { required: false }),
  dateRule(query('to'), 'To date', { required: false }),
  booleanQueryRule('upcoming'),
];

const createAppointmentRules = [
  // Staff book on behalf of a patient, so for them `patient` is required.
  body('patient')
    .custom((value, { req }) => req.user.role !== 'staff' || Boolean(value))
    .withMessage('Patient is required'),
  mongoIdRule(body('patient'), 'Patient', { required: false }),
  mongoIdRule(body('dentist'), 'Dentist'),
  mongoIdRule(body('service'), 'Service', { required: false }),
  body('services')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Services must be an array with at least one service'),
  body('services.*')
    .optional()
    .isMongoId()
    .withMessage('Each service must be a valid ID'),
  body()
    .custom((_, { req }) => {
      const hasService = Boolean(req.body.service);
      const hasServices = Array.isArray(req.body.services) && req.body.services.length > 0;
      if (!hasService && !hasServices) {
        throw new Error('At least one service is required');
      }
      return true;
    }),
  dateRule(body('date'), 'Date'),
  startTimeRule(true),
  textRule('reason', 'Reason', 500),
  body('status')
    .optional()
    .isIn(['pending', 'confirmed'])
    .withMessage('Initial status must be pending or confirmed'),
];

const updateAppointmentRules = [
  mongoIdRule(body('dentist'), 'Dentist', { required: false }),
  mongoIdRule(body('service'), 'Service', { required: false }),
  body('services')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Services must be an array with at least one service'),
  body('services.*')
    .optional()
    .isMongoId()
    .withMessage('Each service must be a valid ID'),
  dateRule(body('date'), 'Date', { required: false }),
  startTimeRule(false),
  textRule('reason', 'Reason', 500),
];

const updateStatusRules = [
  body('status')
    .exists({ values: 'falsy' })
    .withMessage('Status is required')
    .bail()
    .isIn(APPOINTMENT_STATUSES)
    .withMessage('Invalid status'),
  textRule('cancellationReason', 'Cancellation reason', 300),
];

const treatmentRules = [
  textRule('diagnosis', 'Diagnosis', 500, { required: true }),
  textRule('procedure', 'Procedure', 500, { required: true }),
  textRule('notes', 'Notes', 1000),
  textRule('prescription', 'Prescription', 500),
  dateRule(body('followUpDate'), 'Follow-up date', { required: false }),
];

module.exports = {
  listAppointmentsRules,
  createAppointmentRules,
  updateAppointmentRules,
  updateStatusRules,
  treatmentRules,
};
