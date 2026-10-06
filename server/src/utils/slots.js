const { CLINIC } = require('../config/constants');
const { toMinutes, fromMinutes, isFuture } = require('./time');

/** Two time ranges [aStart, aEnd) and [bStart, bEnd) overlap if each starts before the other ends. */
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Builds the list of candidate time slots for one dentist on one date.
 *
 * - A candidate starts every 30 minutes inside the dentist's working hours.
 * - It must fully fit: start + service duration <= dentist end time.
 * - It is unavailable if it overlaps an existing booking (multi-slot services
 *   are handled because we compare minute ranges, not just start times)
 *   or if it is already in the past.
 *
 * @param {object} params
 * @param {{startTime: string, endTime: string}} params.dentist
 * @param {number} params.durationMinutes   service duration
 * @param {string} params.date              "YYYY-MM-DD"
 * @param {{start: number, end: number}[]} params.bookedRanges  existing bookings in minutes
 * @param {{date: string, minutes: number}} params.now  current clinic time
 */
function generateSlots({ dentist, durationMinutes, date, bookedRanges, now }) {
  const dayStart = toMinutes(dentist.startTime);
  const dayEnd = toMinutes(dentist.endTime);
  const slots = [];

  for (let start = dayStart; start + durationMinutes <= dayEnd; start += CLINIC.slotMinutes) {
    const end = start + durationMinutes;
    const startTime = fromMinutes(start);
    const isTaken = bookedRanges.some((range) => rangesOverlap(start, end, range.start, range.end));

    slots.push({
      startTime,
      endTime: fromMinutes(end),
      available: !isTaken && isFuture(date, startTime, now),
    });
  }

  return slots;
}

module.exports = { generateSlots, rangesOverlap };
