/**
 * Appointment business logic shared by the appointment, dentist (availability)
 * and dashboard controllers. Keeping the booking rules in one place guarantees
 * that booking and rescheduling enforce exactly the same checks.
 */
const Appointment = require('../models/Appointment');
const Dentist = require('../models/Dentist');
const Service = require('../models/Service');
const ApiError = require('../utils/ApiError');
const { ACTIVE_STATUSES, UPCOMING_STATUSES, TERMINAL_STATUSES, CLINIC, DAY_NAMES } = require('../config/constants');
const { toMinutes, fromMinutes, clinicNow, dayOfWeek, isFuture, hoursUntil } = require('../utils/time');
const { rangesOverlap } = require('../utils/slots');

/** Fields returned when an appointment is populated (see docs/API.md). */
const APPOINTMENT_POPULATE = [
  { path: 'patient', select: 'firstName lastName email phone' },
  { path: 'dentist', select: 'firstName lastName specialization' },
  { path: 'service', select: 'name durationMinutes price' },
];

/**
 * Time ranges (in minutes) already taken on a date, for one dentist or one patient.
 * Only active appointments (pending / confirmed / completed) occupy time.
 */
async function getBookedRanges({ field, id, date, excludeId }) {
  const filter = { [field]: id, date, status: { $in: ACTIVE_STATUSES } };
  if (excludeId) filter._id = { $ne: excludeId };

  const appointments = await Appointment.find(filter).select('startTime endTime').lean();
  return appointments.map((a) => ({ start: toMinutes(a.startTime), end: toMinutes(a.endTime) }));
}

async function hasOverlap({ field, id, date, start, end, excludeId }) {
  const ranges = await getBookedRanges({ field, id, date, excludeId });
  return ranges.some((range) => rangesOverlap(start, end, range.start, range.end));
}

/**
 * Enforces every booking rule from docs/API.md ("Booking rules").
 * Used when creating and when rescheduling (with excludeId = the appointment itself).
 *
 * @returns {Promise<{dentist, service, endTime: string}>}
 */
async function validateBooking({ dentistId, serviceId, patientId, date, startTime, excludeId, actorRole }) {
  const [dentist, service] = await Promise.all([Dentist.findById(dentistId), Service.findById(serviceId)]);

  // Rule 6: dentist and service must exist and be active
  if (!dentist) throw ApiError.notFound('Dentist not found');
  if (!service) throw ApiError.notFound('Service not found');
  if (!dentist.isActive) throw ApiError.badRequest('This dentist is not currently accepting appointments');
  if (!service.isActive) throw ApiError.badRequest('This service is currently unavailable');

  const start = toMinutes(startTime);
  const end = start + service.durationMinutes;

  // Rule 3a: 30-minute grid
  if (start % CLINIC.slotMinutes !== 0) {
    throw ApiError.badRequest('Start time must be on a 30-minute boundary (e.g. 09:00, 09:30)');
  }

  // Rule 1: must be in the future (clinic timezone)
  if (!isFuture(date, startTime)) {
    throw ApiError.badRequest('Appointments must be scheduled in the future');
  }

  // Rule 2: clinic open day + dentist working day
  const day = dayOfWeek(date);
  if (CLINIC.closedDays.includes(day)) {
    throw ApiError.badRequest('The clinic is closed on Sundays');
  }
  if (!dentist.workingDays.includes(day)) {
    throw ApiError.badRequest(`${dentist.fullName} does not work on ${DAY_NAMES[day]}s`);
  }

  // Rule 3b: the whole appointment must fit inside the dentist's hours
  if (start < toMinutes(dentist.startTime) || end > toMinutes(dentist.endTime)) {
    throw ApiError.badRequest(
      `The selected time is outside ${dentist.fullName}'s working hours (${dentist.startTime}-${dentist.endTime})`
    );
  }

  // Rule 4: no overlap with the dentist's other active appointments
  if (await hasOverlap({ field: 'dentist', id: dentist._id, date, start, end, excludeId })) {
    throw ApiError.conflict('This time slot is already booked');
  }

  // Rule 5: the patient cannot be in two places at once
  if (await hasOverlap({ field: 'patient', id: patientId, date, start, end, excludeId })) {
    throw ApiError.conflict(
      actorRole === 'staff'
        ? 'The patient already has another appointment at this time'
        : 'You already have another appointment at this time'
    );
  }

  return { dentist, service, endTime: fromMinutes(end) };
}

/** Patients may only cancel/reschedule at least 24 hours before the start. */
function assertPatientCanChange(appointment) {
  if (hoursUntil(appointment.date, appointment.startTime) < CLINIC.minHoursBeforeChange) {
    throw ApiError.badRequest(
      'Appointments can only be cancelled or rescheduled at least 24 hours before the start time. Please contact the clinic.'
    );
  }
}

/** Mongo filter: appointments that are still going to happen (pending/confirmed, not yet finished). */
function upcomingFilter(now = clinicNow()) {
  return {
    status: { $in: UPCOMING_STATUSES },
    $or: [{ date: { $gt: now.date } }, { date: now.date, endTime: { $gt: now.time } }],
  };
}

/** Mongo filter: the opposite of upcoming (finished, past, or in a terminal status). */
function pastFilter(now = clinicNow()) {
  return {
    $or: [
      { status: { $in: TERMINAL_STATUSES } },
      { date: { $lt: now.date } },
      { date: now.date, endTime: { $lte: now.time } },
    ],
  };
}

/** True if the dentist/service has pending/confirmed appointments from today onwards. */
function hasUpcomingAppointments(field, id) {
  return Appointment.exists({
    [field]: id,
    status: { $in: UPCOMING_STATUSES },
    date: { $gte: clinicNow().date },
  });
}

module.exports = {
  APPOINTMENT_POPULATE,
  getBookedRanges,
  validateBooking,
  assertPatientCanChange,
  upcomingFilter,
  pastFilter,
  hasUpcomingAppointments,
};
