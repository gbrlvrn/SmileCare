/**
 * Client-side validation. Small pure functions (easy to test and to explain)
 * plus one `validateXxx(values)` per form that returns an errors object:
 *   {}                                   → form is valid
 *   { email: 'Enter a valid email' }     → show this message under the email field
 * The server validates everything again; this only gives faster feedback.
 */
import { todayISO } from './formatters.js';

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

/** Rules shown in the live password checklist (min 8 chars, lowercase, uppercase, number, symbol). */
export const PASSWORD_RULES = [
  { id: 'length', label: 'Minimum of 8 characters', test: (pw) => pw.length >= 8 && pw.length <= 64 },
  { id: 'lower', label: 'At least one lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { id: 'upper', label: 'At least one uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'digit', label: 'At least one number', test: (pw) => /\d/.test(pw) },
  { id: 'symbol', label: 'At least one symbol', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

/** Returns [{ id, label, passed, status }] for the checklist UI. */
export const getPasswordChecks = (password = '', confirmPassword) => {
  const hasPassword = Boolean(password && password.length > 0);
  const checks = PASSWORD_RULES.map((rule) => {
    const isPassed = rule.test(password);
    return {
      id: rule.id,
      label: rule.label,
      passed: isPassed,
      status: !hasPassword ? 'neutral' : isPassed ? 'met' : 'unmet',
    };
  });

  if (confirmPassword !== undefined) {
    const hasConfirm = Boolean(confirmPassword && confirmPassword.length > 0);
    const isMatch = Boolean(hasPassword && hasConfirm && password === confirmPassword);
    checks.push({
      id: 'match',
      label: 'Passwords must match',
      passed: isMatch,
      status: !hasConfirm ? 'neutral' : isMatch ? 'met' : 'unmet',
    });
  }

  return checks;
};

/**
 * Returns an error message if the password breaks the policy, otherwise ''.
 * @param {string} password
 */
export const passwordPolicy = (password = '') => {
  if (!password) return 'Password is required';
  const failed = PASSWORD_RULES.find((rule) => !rule.test(password));
  if (!failed) return '';
  if (failed.id === 'length') return 'Password must be at least 8 characters';
  if (failed.id === 'symbol') return 'Password needs at least one symbol (!@#$%^&* etc.)';
  return `Password needs ${failed.label.toLowerCase()}`;
};

// ---------- Shared field validators (return a message or '') ----------

const LETTERS_ONLY_RE = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ\s]+$/;

/** Validates a first/last name (letters and spaces only, max limit). */
export const validateName = (value, label, maxLimit = 30) => {
  if (!required(value)) return `${label} is required`;
  const trimmed = String(value).trim();
  if (trimmed.length < 2) return `${label} must be at least 2 letters`;
  if (trimmed.length > maxLimit) return `${label} must be at most ${maxLimit} letters`;
  if (!LETTERS_ONLY_RE.test(trimmed)) return `${label} can only contain letters`;
  return '';
};

const EMAIL_SYNTAX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,24}$/;

/** Strict email validation requiring '@' and a real domain extension. */
export const validateEmail = (value) => {
  if (!required(value)) return 'Email is required';
  const trimmed = String(value).trim();
  if (!trimmed.includes('@')) return "Email must include an '@'";

  const [localPart, ...domainParts] = trimmed.split('@');
  if (!localPart || !localPart.trim()) return "Email must include a name before '@'";
  if (domainParts.length > 1) return "Email cannot contain multiple '@' symbols";

  const domain = domainParts[0];
  if (!domain || !domain.trim()) return "Email must include a domain after '@' (e.g. gmail.com)";
  if (!domain.includes('.')) return 'Domain must include an extension (e.g. .com, .ph)';
  if (domain.startsWith('.') || domain.endsWith('.')) return 'Domain cannot start or end with a dot';
  if (domain.includes('..')) return 'Domain cannot contain consecutive dots';

  const tld = domain.split('.').pop()?.toLowerCase();
  if (!tld || !/^[a-z]{2,24}$/.test(tld)) {
    return 'Enter a valid domain extension (e.g. .com, .org, .ph)';
  }

  if (!EMAIL_SYNTAX.test(trimmed)) {
    return 'Please enter a valid email address';
  }
  return '';
};

/** Philippine mobile number validation (e.g. 09171234567 or +639171234567). */
export const validatePhMobile = (value, { required: isReq = false, label = 'Phone number' } = {}) => {
  if (!isReq && (!value || String(value).trim() === '')) return '';
  if (isReq && (!value || String(value).trim() === '')) return `${label} is required`;

  const trimmed = String(value).trim();
  let digits = trimmed.replace(/\D/g, '');

  if (digits.startsWith('63')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (!digits.startsWith('9')) {
    return `${label} must start with 09 or +639`;
  }
  if (digits.length !== 10) {
    return `${label} must be 11 digits (e.g. 09171234567)`;
  }
  return '';
};

/** Optional phone: empty is fine, otherwise must be a PH mobile number. */
export const validateOptionalPhone = (value, label = 'Phone number') =>
  validatePhMobile(value, { required: false, label });

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

/** Register form: firstName, lastName, email, phone, address, dateOfBirth, gender, password, confirmPassword */
export function validateRegister(values) {
  return clean({
    firstName: validateName(values.firstName, 'First name', 30),
    lastName: validateName(values.lastName, 'Last name', 30),
    email: validateEmail(values.email),
    phone: validatePhMobile(values.phone, { required: true }),
    address: !required(values.address)
      ? 'Address is required'
      : !maxLen(values.address, 200)
        ? 'Address must be at most 200 characters'
        : '',
    dateOfBirth: !required(values.dateOfBirth)
      ? 'Birth date is required'
      : validateOptionalBirthDate(values.dateOfBirth),
    gender: !required(values.gender)
      ? 'Please select your gender'
      : !['male', 'female'].includes(values.gender)
        ? 'Select a valid gender'
        : '',
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
