/**
 * Date/time helpers.
 *
 * Appointments store `date` as "YYYY-MM-DD" and times as "HH:mm" in clinic-local
 * time (Asia/Manila). Working with plain strings + minutes avoids UTC off-by-one
 * bugs, and string comparison of "YYYY-MM-DD" values sorts chronologically.
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const MINUTES_PER_DAY = 24 * 60;

const clinicTimeZone = () => process.env.CLINIC_TIMEZONE || 'Asia/Manila';

/** "HH:mm" -> minutes since midnight. */
function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** minutes since midnight -> "HH:mm". */
function fromMinutes(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Current date and time in the clinic's timezone. */
function clinicNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: clinicTimeZone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const get = (type) => parts.find((p) => p.type === type).value;
  const time = `${get('hour')}:${get('minute')}`;

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time,
    minutes: toMinutes(time),
  };
}

/** "YYYY-MM-DD" -> UTC midnight timestamp (timezone-independent day arithmetic). */
function toUtcMs(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** True for real calendar dates such as "2026-02-28" (rejects "2026-02-30"). */
function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) return false;
  return new Date(toUtcMs(dateStr)).toISOString().slice(0, 10) === dateStr;
}

/** Day of week for a "YYYY-MM-DD" string: 0 = Sunday ... 6 = Saturday. */
function dayOfWeek(dateStr) {
  return new Date(toUtcMs(dateStr)).getUTCDay();
}

/** Adds (or subtracts) whole days to a "YYYY-MM-DD" string. */
function addDays(dateStr, days) {
  return new Date(toUtcMs(dateStr) + days * MINUTES_PER_DAY * 60000).toISOString().slice(0, 10);
}

/** Number of hours from "now" (clinic time) until the given date + "HH:mm". */
function hoursUntil(dateStr, time, now = clinicNow()) {
  const dayDiff = (toUtcMs(dateStr) - toUtcMs(now.date)) / (MINUTES_PER_DAY * 60000);
  const minutesDiff = dayDiff * MINUTES_PER_DAY + toMinutes(time) - now.minutes;
  return minutesDiff / 60;
}

/** True if date + "HH:mm" is strictly after the current clinic time. */
function isFuture(dateStr, time, now = clinicNow()) {
  return dateStr > now.date || (dateStr === now.date && toMinutes(time) > now.minutes);
}

module.exports = {
  DATE_REGEX,
  TIME_REGEX,
  toMinutes,
  fromMinutes,
  clinicNow,
  isValidDateString,
  dayOfWeek,
  addDays,
  hoursUntil,
  isFuture,
};
