import {
  CalendarCheck,
  CalendarPlus,
  ClipboardPulse,
  ClockHistory,
  Grid1x2,
  People,
  PersonBadge,
  PersonCircle,
  PersonGear,
} from 'react-bootstrap-icons';

/** User roles returned by the API. */
export const ROLES = {
  PATIENT: 'patient',
  STAFF: 'staff',
};

/** Home (dashboard) path for each role. */
export const ROLE_HOME = {
  patient: '/patient',
  staff: '/staff',
};

/** Human labels for roles (shown in the top bar). */
export const ROLE_LABELS = {
  patient: 'Patient',
  staff: 'Clinic Staff',
};

/**
 * Appointment statuses with their display label and Bootstrap colour variant.
 * The order matches the normal life-cycle of an appointment.
 */
export const APPOINTMENT_STATUSES = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'primary' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  'no-show': { label: 'No-show', variant: 'secondary' },
};

/** [{ value, label }] list for status filter dropdowns. */
export const STATUS_OPTIONS = Object.entries(APPOINTMENT_STATUSES).map(([value, s]) => ({
  value,
  label: s.label,
}));

/** Gender options accepted by the API. */
export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

/** Weekdays as used by Dentist.workingDays (0 = Sunday, clinic closed). */
export const WEEKDAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

/** Clinic opening rules (mirrors the server rules in docs/API.md). */
export const CLINIC_HOURS = {
  timezone: 'Asia/Manila',
  openDays: [1, 2, 3, 4, 5, 6], // Mon–Sat
  open: '09:00',
  close: '17:00',
  slotMinutes: 30,
  label: 'Mon–Sat, 9:00 AM – 5:00 PM',
};

/** Allowed service durations in minutes. */
export const SERVICE_DURATIONS = [30, 60, 90, 120];

/** Default page size for paginated lists. */
export const PAGE_SIZE = 10;

/** Clinic contact details (placeholders shown on the landing page footer). */
export const CLINIC_INFO = {
  name: 'SmileCare Dental Clinic',
  address: '123 Rizal Avenue, Quezon City, Metro Manila',
  phone: '(02) 8123 4567',
  mobile: '0917 123 4567',
  email: 'hello@smilecare.com',
};

/**
 * Sidebar navigation for each role.
 * `end: true` makes NavLink active only on the exact path (used for dashboards).
 */
export const PATIENT_NAV = [
  { to: '/patient', label: 'Dashboard', icon: Grid1x2, end: true },
  { to: '/patient/book', label: 'Book Appointment', icon: CalendarPlus },
  { to: '/patient/appointments', label: 'My Appointments', icon: CalendarCheck },
  { to: '/patient/history', label: 'Treatment History', icon: ClockHistory },
  { to: '/patient/profile', label: 'Profile', icon: PersonCircle },
];

export const STAFF_NAV = [
  { to: '/staff', label: 'Dashboard', icon: Grid1x2, end: true },
  { to: '/staff/appointments', label: 'Appointments', icon: CalendarCheck },
  { to: '/staff/patients', label: 'Patients', icon: People },
  { to: '/staff/dentists', label: 'Dentists', icon: PersonBadge },
  { to: '/staff/services', label: 'Services', icon: ClipboardPulse },
  { to: '/staff/accounts', label: 'Staff Accounts', icon: PersonGear },
  { to: '/staff/profile', label: 'Profile', icon: PersonCircle },
];

/** Navigation items by role. */
export const NAV_BY_ROLE = {
  patient: PATIENT_NAV,
  staff: STAFF_NAV,
};
