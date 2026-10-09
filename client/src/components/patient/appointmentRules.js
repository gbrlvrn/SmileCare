/**
 * Patient-side appointment rules (mirrors the server rules in docs/API.md).
 * Kept in one place so the dashboard, list and detail pages agree on
 * when an appointment can still be cancelled or rescheduled online.
 */
import { CLINIC_INFO } from '../../utils/constants';
import { fullName, toInputDate } from '../../utils/formatters';

/** Asia/Manila is always UTC+8 (the Philippines has no daylight saving time). */
const MANILA_UTC_OFFSET = '+08:00';

/** Patients may only change an appointment at least this many hours before it starts. */
export const CHANGE_CUTOFF_HOURS = 24;

/** Statuses that are still "active" (not finished / cancelled). */
export const ACTIVE_STATUSES = ['pending', 'confirmed'];

/**
 * Start of an appointment as a timestamp (ms), interpreting date + startTime in clinic time.
 * @param {{ date: string, startTime: string }} appointment
 * @returns {number} NaN if the date/time is missing
 */
export function appointmentStartMs(appointment) {
  const date = toInputDate(appointment?.date);
  if (!date || !appointment?.startTime) return NaN;
  return Date.parse(`${date}T${appointment.startTime}:00${MANILA_UTC_OFFSET}`);
}

/** Hours from now until the appointment starts (negative when it is in the past). */
export function hoursUntilStart(appointment, now = Date.now()) {
  return (appointmentStartMs(appointment) - now) / (60 * 60 * 1000);
}

/** True for pending/confirmed appointments. */
export const isActive = (appointment) => ACTIVE_STATUSES.includes(appointment?.status);

/**
 * Can the patient cancel or reschedule this appointment online?
 * Only pending/confirmed ones that start at least 24 hours from now.
 */
export function canPatientChange(appointment, now = Date.now()) {
  return isActive(appointment) && hoursUntilStart(appointment, now) >= CHANGE_CUTOFF_HOURS;
}

/**
 * Explains why an active appointment can no longer be changed online ('' if it can).
 * Terminal appointments (completed/cancelled/no-show) also return ''.
 */
export function changeBlockedReason(appointment, now = Date.now()) {
  if (!isActive(appointment) || canPatientChange(appointment, now)) return '';
  return (
    `Appointments can only be cancelled or rescheduled online at least ${CHANGE_CUTOFF_HOURS} hours ` +
    `before they start. Please call the clinic at ${CLINIC_INFO.phone} for any changes.`
  );
}

/** Dentist display name with a fallback for deleted dentists (null in old appointments). */
export const dentistLabel = (dentist) => (dentist ? fullName(dentist) : 'Dentist no longer available');

/** Service display name with a fallback for deleted services. */
export const serviceLabel = (service) => service?.name || 'Service no longer available';

/** Formats one or multiple services for an appointment display. */
export const servicesLabel = (appointment) => {
  if (appointment?.services && appointment.services.length > 0) {
    return appointment.services.map((s) => s?.name || 'Service').join(', ');
  }
  return serviceLabel(appointment?.service);
};

/** Returns an array of services for an appointment. */
export const appointmentServices = (appointment) => {
  if (appointment?.services && appointment.services.length > 0) {
    return appointment.services;
  }
  if (appointment?.service) {
    return [appointment.service];
  }
  return [];
};
