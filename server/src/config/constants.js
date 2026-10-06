/**
 * Application-wide constants (business rules live here so they are easy to find and explain).
 */

const ROLES = Object.freeze({ PATIENT: 'patient', STAFF: 'staff' });

const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];

// Statuses that occupy a time slot (used for double-booking checks).
const ACTIVE_STATUSES = ['pending', 'confirmed', 'completed'];

// Statuses of appointments that are still going to happen.
const UPCOMING_STATUSES = ['pending', 'confirmed'];

// Once an appointment reaches one of these statuses it can no longer change.
const TERMINAL_STATUSES = ['completed', 'cancelled', 'no-show'];

// Allowed status transitions per role (see docs/API.md "Status transitions").
const STATUS_TRANSITIONS = {
  staff: {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled', 'no-show'],
  },
  patient: {
    pending: ['cancelled'],
    confirmed: ['cancelled'],
  },
};

const SERVICE_DURATIONS = [30, 60, 90, 120];

const CLINIC = Object.freeze({
  openTime: '09:00',
  closeTime: '17:00',
  slotMinutes: 30,
  closedDays: [0], // Sunday
  minHoursBeforeChange: 24, // patients must cancel/reschedule at least 24 h ahead
});

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

module.exports = {
  ROLES,
  GENDERS,
  APPOINTMENT_STATUSES,
  ACTIVE_STATUSES,
  UPCOMING_STATUSES,
  TERMINAL_STATUSES,
  STATUS_TRANSITIONS,
  SERVICE_DURATIONS,
  CLINIC,
  DAY_NAMES,
};
