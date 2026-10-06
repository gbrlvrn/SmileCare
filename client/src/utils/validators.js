/**
 * Client-side validation. Small pure functions (easy to test and to explain)
 * plus one `validateXxx(values)` per form that returns an errors object:
 *   {}                                   → form is valid
 *   { email: 'Enter a valid email' }     → show this message under the email field
 * The server validates everything again; this only gives faster feedback.
 */
import { todayISO } from './formatters';

// ---------- Basic predicates (return true when the value is OK) ----------

/** Not empty after trimming. */
export const required = (value) =>
  value !== undefined && value !== null && String(value).trim() !== '';

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());

/** Philippine mobile number: 09XXXXXXXXX or +639XXXXXXXXX */
export const isPhPhone = (value) => /^(09|\+639)\d{9}$/.test(String(value).trim());

export const matches = (a, b) => a === b;

export const minLen = (value, n) => String(value ?? '').trim().length >= n;

export const maxLen = (value, n) => String(value ?? '').trim().length <= n;

/** True if 'YYYY-MM-DD' is today or later (clinic timezone). Pass allowToday=false for strictly future. */
export const isFutureDate = (iso, allowToday = true) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return false;
  const today = todayISO();
  return allowToday ? iso >= today : iso > today; // ISO strings compare correctly as text
};

/** True if 'YYYY-MM-DD' is strictly before today (e.g. date of birth). */
export const isPastDate = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso || '') && iso < todayISO();

// ---------- Password policy ----------

/** Rules shown in the live password checklist (8–64 chars, upper, lower, digit). */
export const PASSWORD_RULES = [
  { id: 'length', label: '8–64 characters', test: (pw) => pw.length >= 8 && pw.length <= 64 },
  { id: 'upper', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'lower', label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { id: 'digit', label: 'One number', test: (pw) => /\d/.test(pw) },
];

/** Returns [{ id, label, passed }] for the checklist UI. */
export const getPasswordChecks = (password = '') =>
  PASSWORD_RULES.map((rule) => ({ id: rule.id, label: rule.label, passed: rule.test(password) }));

/**
 * Returns an error message if the password breaks the policy, otherwise ''.
 * @param {string} password
 */
export const passwordPolicy = (password = '') => {
  if (!password) return 'Password is required';
  const failed = PASSWORD_RULES.find((rule) => !rule.test(password));
  if (!failed) return '';
  if (failed.id === 'length') return 'Password must be 8–64 characters';
  return `Password needs at least ${failed.label.toLowerCase()}`;
};

// ---------- Shared field validators (return a message or '') ----------

const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ.' -]+$/;

/** Validates a first/last name. */
export const validateName = (value, label) => {
  if (!required(value)) return `${label} is required`;
  if (!maxLen(value, 50)) return `${label} must be at most 50 characters`;
  if (!NAME_RE.test(value.trim())) return `${label} can only contain letters, spaces, . ' -`;
  return '';
};

export const validateEmail = (value) => {
  if (!required(value)) return 'Email is required';
  if (!isEmail(value)) return 'Enter a valid email address';
  return '';
};

/** Optional phone: empty is fine, otherwise must be a PH mobile number. */
export const validateOptionalPhone = (value) =>
  required(value) && !isPhPhone(value) ? 'Use 09XXXXXXXXX or +639XXXXXXXXX' : '';

/** Optional date of birth: empty is fine, otherwise must be in the past and after 1900. */
export const validateOptionalBirthDate = (value) => {
  if (!required(value)) return '';
  if (!isPastDate(value)) return 'Date of birth must be in the past';
  if (value < '1900-01-01') return 'Enter a valid date of birth';
  return '';
};

/** Removes keys whose message is '' so `Object.keys(errors).length` means "has errors". */
const clean = (errors) =>
  Object.fromEntries(Object.entries(errors).filter(([, message]) => Boolean(message)));

// ---------- Form validators ----------

/** Register form: firstName, lastName, email, phone?, dateOfBirth?, gender?, password, confirmPassword */
export function validateRegister(values) {
  return clean({
    firstName: validateName(values.firstName, 'First name'),
    lastName: validateName(values.lastName, 'Last name'),
    email: validateEmail(values.email),
    phone: validateOptionalPhone(values.phone),
    dateOfBirth: validateOptionalBirthDate(values.dateOfBirth),
    password: passwordPolicy(values.password),
    confirmPassword: !required(values.confirmPassword)
      ? 'Please confirm your password'
      : !matches(values.password, values.confirmPassword)
        ? 'Passwords do not match'
        : '',
  });
}

/** Login form: only checks presence/format (the server decides if credentials are right). */
export function validateLogin(values) {
  return clean({
    email: validateEmail(values.email),
    password: required(values.password) ? '' : 'Password is required',
  });
}

/**
 * Profile form.
 * @param {object} values
 * @param {'patient'|'staff'} [role] medicalNotes is only checked for patients
 */
export function validateProfile(values, role = 'patient') {
  return clean({
    firstName: validateName(values.firstName, 'First name'),
    lastName: validateName(values.lastName, 'Last name'),
    phone: validateOptionalPhone(values.phone),
    dateOfBirth: validateOptionalBirthDate(values.dateOfBirth),
    address: maxLen(values.address, 200) ? '' : 'Address must be at most 200 characters',
    medicalNotes:
      role === 'patient' && !maxLen(values.medicalNotes, 500)
        ? 'Medical notes must be at most 500 characters'
        : '',
  });
}

/** Change-password form: currentPassword, newPassword, confirmPassword */
export function validatePasswordChange(values) {
  return clean({
    currentPassword: required(values.currentPassword) ? '' : 'Current password is required',
    newPassword:
      passwordPolicy(values.newPassword) ||
      (values.newPassword && values.newPassword === values.currentPassword
        ? 'New password must be different from the current one'
        : ''),
    confirmPassword: !required(values.confirmPassword)
      ? 'Please confirm your new password'
      : !matches(values.newPassword, values.confirmPassword)
        ? 'Passwords do not match'
        : '',
  });
}

/** True when an errors object has at least one message. */
export const hasErrors = (errors) => Object.keys(errors).length > 0;
