/**
 * Helpers shared by the staff pages (appointment status rules, time options,
 * small date utilities). Plain functions/constants, no React.
 */
import { CheckCircle, CheckAll, PersonX, XCircle } from 'react-bootstrap-icons';
import { CLINIC_HOURS } from '../../utils/constants';
import { todayISO } from '../../utils/formatters';

// ---------- Appointment status rules ----------

/**
 * Status transitions staff are allowed to make (mirrors the table in docs/API.md).
 * completed / cancelled / no-show are terminal: nothing can follow them.
 */
export const STAFF_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no-show'],
  completed: [],
  cancelled: [],
  'no-show': [],
};

/**
 * How each target status is shown as an action button / menu item.
 * `confirm: true` → ask first (ConfirmModal); `needsReason` → show a reason textarea.
 */
export const STATUS_ACTIONS = {
  confirmed: {
    label: 'Confirm',
    icon: CheckCircle,
    variant: 'primary',
    success: 'Appointment confirmed.',
  },
  completed: {
    label: 'Mark completed',
    icon: CheckAll,
    variant: 'success',
    success: 'Appointment marked as completed.',
  },
  'no-show': {
    label: 'Mark no-show',
    icon: PersonX,
    variant: 'secondary',
    success: 'Appointment marked as no-show.',
    confirm: true,
    title: 'Mark as no-show?',
    body: 'The patient did not attend this appointment. This status cannot be changed later.',
  },
  cancelled: {
    label: 'Cancel appointment',
    icon: XCircle,
    variant: 'danger',
    success: 'Appointment cancelled.',
    confirm: true,
    needsReason: true,
    title: 'Cancel this appointment?',
    body: 'The time slot will be released. This cannot be undone.',
  },
};

/** Target statuses staff may choose for an appointment with `status`. */
export const getAllowedStatuses = (status) => STAFF_TRANSITIONS[status] || [];

/** True for completed / cancelled / no-show. */
export const isTerminalStatus = (status) => getAllowedStatuses(status).length === 0;

/** Chart colours per status (same palette as theme.css). */
export const STATUS_COLORS = {
  pending: '#f5a524',
  confirmed: '#1e6fe8',
  completed: '#12a37f',
  cancelled: '#e5484d',
  'no-show': '#94a3b8',
};

// ---------- Time helpers ----------

const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const toTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/**
 * Every 'HH:mm' between `from` and `to` (inclusive) in 30-minute steps.
 * buildTimeOptions('09:00', '10:00') → ['09:00', '09:30', '10:00']
 */
export function buildTimeOptions(from = CLINIC_HOURS.open, to = CLINIC_HOURS.close) {
  const options = [];
  for (let m = toMinutes(from); m <= toMinutes(to); m += CLINIC_HOURS.slotMinutes) {
    options.push(toTime(m));
  }
  return options;
}

/** Current clinic time as 'HH:mm'. */
export function nowClinicTime() {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: CLINIC_HOURS.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Same definition as the API's `upcoming=true`: pending/confirmed and not yet ended. */
export function isUpcomingAppointment(appointment) {
  if (!['pending', 'confirmed'].includes(appointment?.status)) return false;
  const today = todayISO();
  if (appointment.date !== today) return appointment.date > today;
  return (appointment.endTime || appointment.startTime) > nowClinicTime();
}

/** Age in whole years from a 'YYYY-MM-DD' date of birth, or null. */
export function ageFrom(dateOfBirth) {
  const match = String(dateOfBirth || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [ty, tm, td] = todayISO().split('-').map(Number);
  const [y, m, d] = match.slice(1).map(Number);
  let age = ty - y;
  if (tm < m || (tm === m && td < d)) age -= 1;
  return age;
}

// ---------- Payload helpers ----------

/** Returns a copy of `values` with every string trimmed. */
export function trimValues(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
  );
}

/** Removes empty strings (used when creating records: optional fields are simply omitted). */
export function omitEmpty(values) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
}
