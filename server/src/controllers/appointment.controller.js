const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Dentist = require('../models/Dentist');
const Service = require('../models/Service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getPagination, buildPagination } = require('../utils/pagination');
const { searchRegex, nameSearchFilter } = require('../utils/escapeRegex');
const {
  APPOINTMENT_POPULATE,
  validateBooking,
  assertPatientCanChange,
  upcomingFilter,
  pastFilter,
} = require('../services/appointment.service');
const { ROLES, STATUS_TRANSITIONS, TERMINAL_STATUSES } = require('../config/constants');

const isPatient = (req) => req.user.role === ROLES.PATIENT;

/**
 * Loads an appointment and enforces ownership (IDOR protection):
 * a patient may only access their own appointments -> 403 otherwise.
 */
async function findAccessibleAppointment(req) {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw ApiError.notFound('Appointment not found');

  if (isPatient(req) && !appointment.patient.equals(req.user._id)) {
    throw ApiError.forbidden('You do not have permission to access this appointment');
  }
  return appointment;
}

/** Builds the search condition: ids of matching patients, dentists and services. */
async function buildSearchCondition(search, includePatients) {
  const [patientIds, dentistIds, serviceIds] = await Promise.all([
    includePatients ? User.distinct('_id', { role: ROLES.PATIENT, ...nameSearchFilter(search, ['email']) }) : [],
    Dentist.distinct('_id', nameSearchFilter(search, ['specialization'])),
    Service.distinct('_id', { name: searchRegex(search) }),
  ]);

  const or = [{ dentist: { $in: dentistIds } }, { service: { $in: serviceIds } }];
  if (includePatients) or.push({ patient: { $in: patientIds } });
  return { $or: or };
}

/** Sort: ?sort=date / -date / createdAt / -createdAt / status. */
function buildSort(sort, upcoming) {
  if (sort === 'date') return { date: 1, startTime: 1 };
  if (sort === '-date') return { date: -1, startTime: -1 };
  if (['createdAt', '-createdAt', 'status', '-status'].includes(sort)) {
    return { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 };
  }
  return upcoming === 'true' ? { date: 1, startTime: 1 } : { date: -1, startTime: -1 };
}

/**
 * GET /api/appointments
 * Patients only ever see their own appointments (the filter is forced server-side).
 */
const listAppointments = asyncHandler(async (req, res) => {
  const { search, status, dentist, from, to, upcoming, sort } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const conditions = [];
  if (isPatient(req)) conditions.push({ patient: req.user._id });
  if (status) conditions.push({ status });
  if (dentist) conditions.push({ dentist });
  if (from) conditions.push({ date: { $gte: from } });
  if (to) conditions.push({ date: { $lte: to } });
  if (upcoming === 'true') conditions.push(upcomingFilter());
  if (upcoming === 'false') conditions.push(pastFilter());
  if (search) conditions.push(await buildSearchCondition(search, !isPatient(req)));

  const filter = conditions.length ? { $and: conditions } : {};
  const [appointments, total] = await Promise.all([
    Appointment.find(filter).sort(buildSort(sort, upcoming)).skip(skip).limit(limit).populate(APPOINTMENT_POPULATE),
    Appointment.countDocuments(filter),
  ]);

  sendSuccess(res, appointments, { pagination: buildPagination(page, limit, total) });
});

/** GET /api/appointments/:id — owner patient or staff. */
const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await findAccessibleAppointment(req);
  await appointment.populate(APPOINTMENT_POPULATE);
  sendSuccess(res, appointment);
});

/**
 * POST /api/appointments
 * Patient: books for themselves. Staff: must provide an active patient id and may
 * create the appointment directly as "confirmed".
 */
const createAppointment = asyncHandler(async (req, res) => {
  const { dentist, service, date, startTime, reason } = req.body;
  let patientId = req.user._id;
  let status = 'pending';

  if (!isPatient(req)) {
    const patient = await User.findOne({ _id: req.body.patient, role: ROLES.PATIENT });
    if (!patient) throw ApiError.notFound('Patient not found');
    if (!patient.isActive) throw ApiError.badRequest('This patient account is deactivated');
    patientId = patient._id;
    if (req.body.status === 'confirmed') status = 'confirmed';
  }

  const booking = await validateBooking({
    dentistId: dentist,
    serviceId: service,
    patientId,
    date,
    startTime,
    actorRole: req.user.role,
  });

  // A race between two simultaneous requests is caught by the unique index
  // (E11000 -> 409 "This time slot is already booked" in the error handler).
  const appointment = await Appointment.create({
    patient: patientId,
    dentist: booking.dentist._id,
    service: booking.service._id,
    date,
    startTime,
    endTime: booking.endTime,
    status,
    reason: reason || '',
    createdBy: req.user._id,
  });

  await appointment.populate(APPOINTMENT_POPULATE);
  sendSuccess(res, appointment, { status: 201, message: 'Appointment booked successfully' });
});

/**
 * PUT /api/appointments/:id — reschedule and/or edit the reason.
 * Patients: only >= 24 h before the current start; a reschedule resets the status to "pending".
 */
const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await findAccessibleAppointment(req);

  if (TERMINAL_STATUSES.includes(appointment.status)) {
    throw ApiError.badRequest(`A ${appointment.status} appointment can no longer be changed`);
  }
  if (isPatient(req)) assertPatientCanChange(appointment);

  const { dentist, service, date, startTime, reason } = req.body;
  const scheduleChanged =
    (dentist && dentist !== String(appointment.dentist)) ||
    (service && service !== String(appointment.service)) ||
    (date && date !== appointment.date) ||
    (startTime && startTime !== appointment.startTime);

  if (scheduleChanged) {
    const booking = await validateBooking({
      dentistId: dentist || appointment.dentist,
      serviceId: service || appointment.service,
      patientId: appointment.patient,
      date: date || appointment.date,
      startTime: startTime || appointment.startTime,
      excludeId: appointment._id,
      actorRole: req.user.role,
    });

    appointment.dentist = booking.dentist._id;
    appointment.service = booking.service._id;
    appointment.date = date || appointment.date;
    appointment.startTime = startTime || appointment.startTime;
    appointment.endTime = booking.endTime;
    if (isPatient(req)) appointment.status = 'pending'; // the clinic must confirm the new time
  }

  if (reason !== undefined) appointment.reason = reason;

  await appointment.save();
  await appointment.populate(APPOINTMENT_POPULATE);
  sendSuccess(res, appointment, {
    message: scheduleChanged ? 'Appointment rescheduled successfully' : 'Appointment updated successfully',
  });
});

/** PATCH /api/appointments/:id/status — see the transition table in docs/API.md. */
const updateStatus = asyncHandler(async (req, res) => {
  const { status, cancellationReason } = req.body;
  const appointment = await findAccessibleAppointment(req);
  const current = appointment.status;

  if (current === status) throw ApiError.badRequest(`Appointment is already ${status}`);

  const allowed = STATUS_TRANSITIONS[req.user.role][current] || [];
  if (!allowed.includes(status)) {
    if (isPatient(req) && status !== 'cancelled') {
      throw ApiError.badRequest('Patients can only cancel appointments');
    }
    throw ApiError.badRequest(`Cannot change status from ${current} to ${status}`);
  }
  if (isPatient(req)) assertPatientCanChange(appointment);

  appointment.status = status;
  if (status === 'cancelled') appointment.cancellationReason = cancellationReason || null;

  await appointment.save(); // pre-validate hook frees the slot (slotActive=false) when cancelled
  await appointment.populate(APPOINTMENT_POPULATE);
  sendSuccess(res, appointment, { message: `Appointment ${status === 'no-show' ? 'marked as no-show' : status}` });
});

/** PUT /api/appointments/:id/treatment — staff only, completed appointments only. */
const updateTreatment = asyncHandler(async (req, res) => {
  const appointment = await findAccessibleAppointment(req);
  if (appointment.status !== 'completed') {
    throw ApiError.badRequest('Treatment notes can only be recorded for completed appointments');
  }

  const { diagnosis, procedure, notes, prescription, followUpDate } = req.body;
  appointment.treatment = {
    diagnosis,
    procedure,
    notes: notes || '',
    prescription: prescription || '',
    followUpDate: followUpDate || null,
    recordedBy: req.user._id,
    recordedAt: new Date(),
  };

  await appointment.save();
  await appointment.populate(APPOINTMENT_POPULATE);
  sendSuccess(res, appointment, { message: 'Treatment notes saved' });
});

/** DELETE /api/appointments/:id — staff only, hard delete. */
const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (!appointment) throw ApiError.notFound('Appointment not found');
  sendSuccess(res, null, { message: 'Appointment deleted successfully' });
});

module.exports = {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  updateStatus,
  updateTreatment,
  deleteAppointment,
};
