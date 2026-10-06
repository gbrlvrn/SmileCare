const User = require('../models/User');
const Appointment = require('../models/Appointment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, pick } = require('../utils/response');
const { getPagination, buildPagination, parseSort } = require('../utils/pagination');
const { nameSearchFilter } = require('../utils/escapeRegex');
const { APPOINTMENT_POPULATE } = require('../services/appointment.service');
const { ROLES } = require('../config/constants');

const PATIENT_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'dateOfBirth',
  'gender',
  'address',
  'medicalNotes',
];
const SORT_FIELDS = ['firstName', 'lastName', 'email', 'createdAt'];

/** Loads a user that has the patient role, or throws 404. */
async function findPatient(id) {
  const patient = await User.findOne({ _id: id, role: ROLES.PATIENT });
  if (!patient) throw ApiError.notFound('Patient not found');
  return patient;
}

/** GET /api/patients — search (name/email/phone), isActive filter, pagination. */
const listPatients = asyncHandler(async (req, res) => {
  const { search, isActive } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = { role: ROLES.PATIENT };
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) Object.assign(filter, nameSearchFilter(search, ['email', 'phone']));

  const sort = parseSort(req.query.sort, SORT_FIELDS, { createdAt: -1 });
  const [patients, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  // Count appointments for the patients on this page with one aggregation.
  const counts = await Appointment.aggregate([
    { $match: { patient: { $in: patients.map((p) => p._id) } } },
    { $group: { _id: '$patient', count: { $sum: 1 } } },
  ]);
  const countById = new Map(counts.map((c) => [String(c._id), c.count]));

  const data = patients.map((p) => ({ ...p.toJSON(), appointmentCount: countById.get(String(p._id)) || 0 }));
  sendSuccess(res, data, { pagination: buildPagination(page, limit, total) });
});

/** GET /api/patients/:id — patient profile with full appointment history (newest first). */
const getPatient = asyncHandler(async (req, res) => {
  const patient = await findPatient(req.params.id);
  const appointments = await Appointment.find({ patient: patient._id })
    .sort({ date: -1, startTime: -1 })
    .populate(APPOINTMENT_POPULATE);

  sendSuccess(res, { patient, appointments });
});

/** POST /api/patients — walk-in registration by staff. */
const createPatient = asyncHandler(async (req, res) => {
  const data = pick(req.body, [...PATIENT_FIELDS, 'password']);

  if (await User.exists({ email: data.email })) {
    throw ApiError.conflict('Email is already registered');
  }

  const patient = await User.create({ ...data, role: ROLES.PATIENT });
  sendSuccess(res, patient, { status: 201, message: 'Patient created successfully' });
});

/** PUT /api/patients/:id — profile fields, isActive, optional password reset. */
const updatePatient = asyncHandler(async (req, res) => {
  const patient = await findPatient(req.params.id);
  const updates = pick(req.body, [...PATIENT_FIELDS, 'isActive', 'password']);

  if (updates.email && updates.email !== patient.email && (await User.exists({ email: updates.email }))) {
    throw ApiError.conflict('Email is already registered');
  }

  Object.assign(patient, updates); // a new password is hashed by the pre-save hook
  await patient.save();

  sendSuccess(res, patient, { message: 'Patient updated successfully' });
});

/** DELETE /api/patients/:id — removes the patient AND all their appointments. */
const deletePatient = asyncHandler(async (req, res) => {
  const patient = await findPatient(req.params.id);

  const { deletedCount } = await Appointment.deleteMany({ patient: patient._id });
  await patient.deleteOne();

  sendSuccess(res, null, {
    message: `Patient deleted successfully (${deletedCount} appointment${deletedCount === 1 ? '' : 's'} removed)`,
  });
});

module.exports = { listPatients, getPatient, createPatient, updatePatient, deletePatient };
