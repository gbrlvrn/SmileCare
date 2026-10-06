/**
 * Display formatters. Dates from the API are clinic-local "YYYY-MM-DD" strings,
 * so we format them in UTC on purpose: this avoids the classic "off by one day"
 * bug that happens when `new Date('2026-10-15')` is shifted by the browser timezone.
 */

const CLINIC_TZ = 'Asia/Manila';
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Extracts "YYYY-MM-DD" from a date string or ISO timestamp.
 * Use it to fill <input type="date"> values.
 * @param {string} value e.g. '1998-04-12' or '1998-04-12T00:00:00.000Z'
 * @returns {string} 'YYYY-MM-DD' or '' when invalid
 */
export function toInputDate(value) {
  if (!value) return '';
  const match = String(value).match(ISO_DATE_RE);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

/**
 * '2026-10-15' → 'Oct 15, 2026'
 * @param {string} value 'YYYY-MM-DD' (or ISO timestamp)
 * @param {Intl.DateTimeFormatOptions} [options] extra options, e.g. { weekday: 'short' }
 */
export function formatDate(value, options = {}) {
  const iso = toInputDate(value);
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
    ...options,
  });
}

/**
 * Splits a 'YYYY-MM-DD' date for calendar-style tiles.
 * '2026-10-15' → { month: 'Oct', day: '15', weekday: 'Thu', label: 'Thu, Oct 15, 2026' }
 */
export function dateParts(value) {
  const iso = toInputDate(value);
  if (!iso) return { month: '—', day: '—', weekday: '', label: '' };
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const fmt = (options) => date.toLocaleDateString('en-US', { timeZone: 'UTC', ...options });
  return {
    month: fmt({ month: 'short' }),
    day: String(d),
    weekday: fmt({ weekday: 'short' }),
    label: fmt({ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
  };
}

/**
 * '14:30' → '2:30 PM'
 * @param {string} time 'HH:mm'
 */
export function formatTime(time) {
  if (!time || !/^\d{1,2}:\d{2}/.test(time)) return '—';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/** ('10:00', '10:30') → '10:00 AM – 10:30 AM' */
export function formatTimeRange(start, end) {
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

/** 1500 → '₱1,500.00' */
export function formatCurrency(amount) {
  const value = Number(amount);
  if (Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

/**
 * Formats a full timestamp (e.g. createdAt) in clinic time: 'Oct 15, 2026, 2:30 PM'
 * @param {string|Date} value
 */
export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: CLINIC_TZ,
  });
}

/** 'Juan Dela Cruz' → 'JC' (first + last word). Strips a leading 'Dr.'. */
export function initials(name = '') {
  const words = String(name)
    .replace(/^dr\.?\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Returns a person's display name from `fullName` or first/last names. */
export function fullName(person) {
  if (!person) return '';
  return person.fullName || [person.firstName, person.lastName].filter(Boolean).join(' ');
}

/** Today's date in the clinic timezone as 'YYYY-MM-DD'. */
export function todayISO() {
  // The 'en-CA' locale formats dates as YYYY-MM-DD.
  return new Date().toLocaleDateString('en-CA', { timeZone: CLINIC_TZ });
}

/**
 * Adds days to a 'YYYY-MM-DD' string and returns a new 'YYYY-MM-DD'.
 * @param {string} iso
 * @param {number} days can be negative
 */
export function addDaysISO(iso, days) {
  const [y, m, d] = toInputDate(iso).split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Day of week (0 = Sunday) for a 'YYYY-MM-DD' string. */
export function weekdayOf(iso) {
  const [y, m, d] = toInputDate(iso).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** 90 → '1 hr 30 min', 30 → '30 min' */
export function formatDuration(minutes) {
  const total = Number(minutes) || 0;
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr${h > 1 ? 's' : ''}`;
  return `${m} min`;
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Dentist working days → readable text.
 * [1,2,3,4,5,6] → 'Mon – Sat', [1,3,5] → 'Mon, Wed, Fri'
 * @param {number[]} days 0 = Sunday
 */
export function formatWorkingDays(days = []) {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 0) return '—';
  const isContinuous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (isContinuous && sorted.length > 2) {
    return `${DAY_SHORT[sorted[0]]} – ${DAY_SHORT[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((d) => DAY_SHORT[d]).join(', ');
}
