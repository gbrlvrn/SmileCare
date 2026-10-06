/**
 * Client-side validation for the staff forms. Each function returns an errors
 * object ({} when valid) and mirrors the rules in docs/API.md. The server checks
 * everything again; this only gives instant feedback.
 */
import { weekdayOf } from '../../utils/formatters';
import {
  isFutureDate,
  maxLen,
  passwordPolicy,
  required,
  validateEmail,
  validateName,
  validateOptionalBirthDate,
  validateOptionalPhone,
} from '../../utils/validators';
import { SERVICE_DURATIONS } from '../../utils/constants';

/** Drops empty messages so `Object.keys(errors).length === 0` means "valid". */
const clean = (errors) =>
  Object.fromEntries(Object.entries(errors).filter(([, message]) => Boolean(message)));

/** Optional text with a max length. */
const maxText = (value, max, label) =>
  maxLen(value, max) ? '' : `${label} must be at most ${max} characters`;

/** Password: required when creating, optional (reset only if filled) when editing. */
const passwordRule = (password, isEdit) => (isEdit && !password ? '' : passwordPolicy(password));

const emailRule = (value) => validateEmail(value) || maxText(value, 100, 'Email');

/**
 * Add / edit patient form.
 * @param {object} values
 * @param {{ isEdit?: boolean }} [options]
 */
export function validatePatientForm(values, { isEdit = false } = {}) {
  return clean({
    firstName: validateName(values.firstName, 'First name'),
    lastName: validateName(values.lastName, 'Last name'),
    email: emailRule(values.email),
    phone: validateOptionalPhone(values.phone),
    dateOfBirth: validateOptionalBirthDate(values.dateOfBirth),
    address: maxText(values.address, 200, 'Address'),
    medicalNotes: maxText(values.medicalNotes, 500, 'Medical notes'),
    password: passwordRule(values.password, isEdit),
  });
}

/**
 * Add / edit staff account form (email can only be set when creating).
 * @param {object} values
 * @param {{ isEdit?: boolean }} [options]
 */
export function validateStaffForm(values, { isEdit = false } = {}) {
  return clean({
    firstName: validateName(values.firstName, 'First name'),
    lastName: validateName(values.lastName, 'Last name'),
    email: isEdit ? '' : emailRule(values.email),
    phone: validateOptionalPhone(values.phone),
    password: passwordRule(values.password, isEdit),
  });
}

const SPECIALIZATION_RE = /^[\p{L}\p{M} &()/,.'-]+$/u;

/** Add / edit dentist form. */
export function validateDentistForm(values) {
  let specialization = '';
  if (!required(values.specialization)) specialization = 'Specialization is required';
  else if (!maxLen(values.specialization, 100)) specialization = 'Specialization must be at most 100 characters';
  else if (!SPECIALIZATION_RE.test(values.specialization.trim())) {
    specialization = 'Specialization contains invalid characters';
  }

  return clean({
    firstName: validateName(values.firstName, 'First name'),
    lastName: validateName(values.lastName, 'Last name'),
    specialization,
    email: required(values.email) ? emailRule(values.email) : '',
    phone: validateOptionalPhone(values.phone),
    bio: maxText(values.bio, 1000, 'Bio'),
    workingDays: values.workingDays.length === 0 ? 'Select at least one working day' : '',
    startTime: required(values.startTime) ? '' : 'Start time is required',
    endTime: !required(values.endTime)
      ? 'End time is required'
      : values.startTime && values.endTime <= values.startTime // 'HH:mm' strings compare correctly
        ? 'End time must be after start time'
        : '',
  });
}

const SERVICE_NAME_RE = /^[\p{L}\p{M}\p{N} &()/,.'+-]+$/u;

/** Add / edit service form. */
export function validateServiceForm(values) {
  let name = '';
  if (!required(values.name)) name = 'Service name is required';
  else if (!maxLen(values.name, 100)) name = 'Service name must be at most 100 characters';
  else if (!SERVICE_NAME_RE.test(values.name.trim())) name = 'Service name contains invalid characters';

  const price = Number(values.price);
  let priceError = '';
  if (!required(values.price)) priceError = 'Price is required';
  else if (Number.isNaN(price) || price < 0 || price > 1000000) {
    priceError = 'Price must be a number between 0 and 1,000,000';
  }

  return clean({
    name,
    description: maxText(values.description, 500, 'Description'),
    durationMinutes: SERVICE_DURATIONS.includes(Number(values.durationMinutes))
      ? ''
      : 'Choose a duration',
    price: priceError,
  });
}

/**
 * Treatment notes form.
 * @param {object} values
 * @param {string} appointmentDate 'YYYY-MM-DD' — a follow-up must come after it
 */
export function validateTreatmentForm(values, appointmentDate) {
  return clean({
    diagnosis: required(values.diagnosis)
      ? maxText(values.diagnosis, 500, 'Diagnosis')
      : 'Diagnosis is required',
    procedure: required(values.procedure)
      ? maxText(values.procedure, 500, 'Procedure')
      : 'Procedure is required',
    notes: maxText(values.notes, 1000, 'Notes'),
    prescription: maxText(values.prescription, 500, 'Prescription'),
    followUpDate:
      values.followUpDate && appointmentDate && values.followUpDate <= appointmentDate
        ? 'Follow-up date must be after the appointment date'
        : '',
  });
}

/**
 * New / edit appointment form.
 * @param {object} values { patient, service, dentist, date, startTime, reason }
 * @param {{ dentist?: object, requirePatient?: boolean, checkSchedule?: boolean }} [options]
 *   `dentist` = selected dentist (for working days); `checkSchedule: false` skips the date
 *   rules (used when editing only the reason of an existing appointment).
 */
export function validateAppointmentForm(values, { dentist, requirePatient = true, checkSchedule = true } = {}) {
  let date = '';
  if (!checkSchedule) date = '';
  else if (!required(values.date)) date = 'Choose a date';
  else if (!isFutureDate(values.date)) date = 'Choose today or a future date';
  else if (weekdayOf(values.date) === 0) date = 'The clinic is closed on Sundays';
  else if (dentist?.workingDays && !dentist.workingDays.includes(weekdayOf(values.date))) {
    date = 'The selected dentist does not work on this day';
  }

  return clean({
    patient: requirePatient && !values.patient ? 'Select a patient' : '',
    service: values.service ? '' : 'Choose a service',
    dentist: values.dentist ? '' : 'Choose a dentist',
    date,
    startTime: values.startTime ? '' : 'Choose a time slot',
    reason: maxText(values.reason, 500, 'Reason'),
  });
}

/** Cancellation reason (optional, max 300). */
export const validateCancellationReason = (reason) => maxText(reason, 300, 'Reason');
