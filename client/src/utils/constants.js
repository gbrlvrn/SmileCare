import {
  ClipboardPulse,
  People,
  PersonBadge,
  PersonGear,
} from 'react-bootstrap-icons';
import {
  CalendarCheckIcon,
  CalendarPlusIcon,
  DashboardIcon,
  ProfileIcon,
  TreatmentHistoryIcon,
} from '../components/icons/SidebarIcons';

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
  confirmed: { label: 'Confirmed', variant: 'success' },
  completed: { label: 'Completed', variant: 'info' },
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

/** Standard dental specializations for dentists directory. */
export const DENTAL_SPECIALIZATIONS = [
  'General Dentistry',
  'Orthodontics',
  'Endodontics',
  'Pediatric Dentistry',
  'Cosmetic Dentistry',
  'Pediatric and Cosmetic Dentistry',
  'Periodontics',
  'Prosthodontics',
  'Oral and Maxillofacial Surgery',
  'Implantology',
];

/** Standard dental services options for services directory. */
export const STANDARD_SERVICES = [
  {
    name: 'Dental Check-up',
    durationMinutes: 30,
    price: 800,
    description: 'Complete oral examination with dental charting and personalized hygiene advice.',
  },
  {
    name: 'Teeth Cleaning',
    durationMinutes: 60,
    price: 1500,
    description: 'Professional scaling and polishing to remove plaque and tartar build-up.',
  },
  {
    name: 'Tooth Extraction',
    durationMinutes: 60,
    price: 2500,
    description: 'Safe removal of damaged, decayed, or problematic teeth under local anesthesia.',
  },
  {
    name: 'Dental Filling (Pasta)',
    durationMinutes: 60,
    price: 1500,
    description: 'Composite tooth-colored restoration to repair cavities and restore tooth function.',
  },
  {
    name: 'Teeth Whitening',
    durationMinutes: 90,
    price: 8000,
    description: 'In-office professional whitening treatment for a brighter smile in a single visit.',
  },
  {
    name: 'Root Canal Treatment',
    durationMinutes: 120,
    price: 12000,
    description: 'Specialized therapy to treat infected tooth pulp, relieve pain, and save the natural tooth.',
  },
  {
    name: 'Braces Consultation',
    durationMinutes: 30,
    price: 1000,
    description: 'Comprehensive orthodontic evaluation and alignment treatment plan discussion.',
  },
  {
    name: 'Fluoride Treatment',
    durationMinutes: 30,
    price: 1200,
    description: 'Concentrated topical fluoride application to strengthen enamel and prevent cavities.',
  },
  {
    name: 'Dental Sealants',
    durationMinutes: 30,
    price: 1000,
    description: 'Protective resin coating applied to the chewing surfaces of molars to prevent decay.',
  },
  {
    name: 'Dentures (Full/Partial)',
    durationMinutes: 60,
    price: 15000,
    description: 'Custom removable dental appliances to replace missing teeth and restore speech and chewing.',
  },
  {
    name: 'Dental Crown / Bridge',
    durationMinutes: 90,
    price: 10000,
    description: 'Custom prosthetic cap or bridge to protect, cover, and restore damaged teeth.',
  },
  {
    name: 'Wisdom Tooth Removal (Odontectomy)',
    durationMinutes: 90,
    price: 8000,
    description: 'Surgical extraction of impacted or partially erupted third molars.',
  },
  {
    name: 'Dental Veneers',
    durationMinutes: 90,
    price: 15000,
    description: 'Custom porcelain or composite shells designed to cover the front surface of teeth.',
  },
  {
    name: 'Periodontal Deep Cleaning',
    durationMinutes: 60,
    price: 3500,
    description: 'Deep root planing and scaling below the gumline to treat gum disease.',
  },
];

export const DENTAL_SERVICE_NAMES = STANDARD_SERVICES.map((s) => s.name);

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
  { to: '/patient', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/patient/book', label: 'Book Appointment', icon: CalendarPlusIcon },
  { to: '/patient/appointments', label: 'My Appointments', icon: CalendarCheckIcon },
  { to: '/patient/history', label: 'Treatment History', icon: TreatmentHistoryIcon },
  { to: '/patient/profile', label: 'Profile', icon: ProfileIcon },
];

export const STAFF_NAV = [
  { to: '/staff', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/staff/appointments', label: 'Appointments', icon: CalendarCheckIcon },
  { to: '/staff/patients', label: 'Patients', icon: People },
  { to: '/staff/dentists', label: 'Dentists', icon: PersonBadge },
  { to: '/staff/services', label: 'Services', icon: ClipboardPulse },
  { to: '/staff/accounts', label: 'Staff Accounts', icon: PersonGear },
  { to: '/staff/profile', label: 'Profile', icon: ProfileIcon },
];

/** Navigation items by role. */
export const NAV_BY_ROLE = {
  patient: PATIENT_NAV,
  staff: STAFF_NAV,
};
