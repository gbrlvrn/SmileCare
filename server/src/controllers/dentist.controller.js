const Dentist = require('../models/Dentist');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, pick } = require('../utils/response');
const { getPagination, buildPagination, parseSort } = require('../utils/pagination');
const { nameSearchFilter } = require('../utils/escapeRegex');
const { clinicNow, dayOfWeek, toMinutes } = require('../utils/time');
const { generateSlots } = require('../utils/slots');
const { getBookedRanges, hasUpcomingAppointments } = require('../services/appointment.service');
const { CLINIC, DAY_NAMES } = require('../config/constants');

const DENTIST_FIELDS = [
  'firstName',
  'lastName',
  'specialization',
  'email',
  'phone',
  'bio',
  'workingDays',
  'startTime',
  'endTime',
  'isActive',
];
const SORT_FIELDS = ['firstName', 'lastName', 'specialization', 'createdAt'];

const isStaff = (req) => req.user && req.user.role === 'staff';

/** Removes duplicates and sorts working days, e.g. [5, 1, 1, 3] -> [1, 3, 5]. */
const normalizeDays = (days) => [...new Set(days)].sort((a, b) => a - b);

/**
 * GET /api/dentists
 * Same behaviour as services: active only (unless staff + ?all=true),
 * full array without ?page, paginated with ?page.
 */
const listDentists = asyncHandler(async (req, res) => {
  const { search, all } = req.query;

  const filter = isStaff(req) && all === 'true' ? {} : { isActive: true };
  if (search) Object.assign(filter, nameSearchFilter(search, ['specialization']));
  const sort = parseSort(req.query.sort, SORT_FIELDS, { lastName: 1, firstName: 1 });

  if (req.query.page === undefined) {
    return sendSuccess(res, await Dentist.find(filter).sort(sort));
  }

  const { page, limit, skip } = getPagination(req.query);
  const [dentists, total] = await Promise.all([
    Dentist.find(filter).sort(sort).skip(skip).limit(limit),
    Dentist.countDocuments(filter),
  ]);
  return sendSuccess(res, dentists, { pagination: buildPagination(page, limit, total) });
});

/** GET /api/dentists/:id — inactive dentists are only visible to staff. */
const getDentist = asyncHandler(async (req, res) => {
  const dentist = await Dentist.findById(req.params.id);
  if (!dentist || (!dentist.isActive && !isStaff(req))) throw ApiError.notFound('Dentist not found');
  sendSuccess(res, dentist);
});

/**
 * GET /api/dentists/:id/availability?date=YYYY-MM-DD&serviceId=...&excludeAppointmentId=...
 * Returns every candidate slot of the day with an `available` flag.
 */
const getAvailability = asyncHandler(async (req, res) => {
  const { date, serviceId } = req.query;
  let { excludeAppointmentId } = req.query;

  const [dentist, service] = await Promise.all([Dentist.findById(req.params.id), Service.findById(serviceId)]);
  if (!dentist) throw ApiError.notFound('Dentist not found');
  if (!service) throw ApiError.notFound('Service not found');

  // A patient may only exclude (i.e. reschedule) one of their own appointments.
  if (excludeAppointmentId && req.user.role === 'patient') {
    const own = await Appointment.exists({ _id: excludeAppointmentId, patient: req.user._id });
    if (!own) excludeAppointmentId = undefined;
  }

  const result = { date, dentistId: String(dentist._id), serviceId: String(service._id), slots: [] };
  const day = dayOfWeek(date);

  let message;
  if (CLINIC.closedDays.includes(day)) message = 'The clinic is closed on Sundays';
  else if (!dentist.isActive) message = `${dentist.fullName} is not currently accepting appointments`;
  else if (!dentist.workingDays.includes(day)) message = `${dentist.fullName} does not work on ${DAY_NAMES[day]}s`;

  if (message) return sendSuccess(res, { ...result, message }, { message });

  const bookedRanges = await getBookedRanges({ field: 'dentist', id: dentist._id, date, excludeId: excludeAppointmentId });
  result.slots = generateSlots({
    dentist,
    durationMinutes: service.durationMinutes,
    date,
    bookedRanges,
    now: clinicNow(),
  });

  return sendSuccess(res, result);
});

/** POST /api/dentists */
const createDentist = asyncHandler(async (req, res) => {
  const data = pick(req.body, DENTIST_FIELDS);
  data.workingDays = normalizeDays(data.workingDays);

  const dentist = await Dentist.create(data);
  sendSuccess(res, dentist, { status: 201, message: 'Dentist created successfully' });
});

/** PUT /api/dentists/:id — partial update. */
const updateDentist = asyncHandler(async (req, res) => {
  const dentist = await Dentist.findById(req.params.id);
  if (!dentist) throw ApiError.notFound('Dentist not found');

  const updates = pick(req.body, DENTIST_FIELDS);
  if (updates.workingDays) updates.workingDays = normalizeDays(updates.workingDays);

  // Re-check hours against the stored values when only one of them is sent.
  const startTime = updates.startTime || dentist.startTime;
  const endTime = updates.endTime || dentist.endTime;
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    throw ApiError.validation('endTime', 'End time must be after start time');
  }

  Object.assign(dentist, updates);
  await dentist.save();
  sendSuccess(res, dentist, { message: 'Dentist updated successfully' });
});

/** DELETE /api/dentists/:id — blocked while the dentist has upcoming appointments. */
const deleteDentist = asyncHandler(async (req, res) => {
  const dentist = await Dentist.findById(req.params.id);
  if (!dentist) throw ApiError.notFound('Dentist not found');

  if (await hasUpcomingAppointments('dentist', dentist._id)) {
    throw ApiError.badRequest(
      'This dentist has upcoming appointments and cannot be deleted. Deactivate the dentist instead.'
    );
  }

  await dentist.deleteOne();
  sendSuccess(res, null, { message: 'Dentist deleted successfully' });
});

module.exports = { listDentists, getDentist, getAvailability, createDentist, updateDentist, deleteDentist };
