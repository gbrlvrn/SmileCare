const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, pick } = require('../utils/response');
const { getPagination, buildPagination, parseSort } = require('../utils/pagination');
const { nameSearchFilter } = require('../utils/escapeRegex');
const { ROLES } = require('../config/constants');

const SORT_FIELDS = ['firstName', 'lastName', 'email', 'createdAt'];

async function findStaff(id) {
  const staff = await User.findOne({ _id: id, role: ROLES.STAFF });
  if (!staff) throw ApiError.notFound('Staff account not found');
  return staff;
}

const isSelf = (req) => String(req.params.id) === String(req.user._id);

/** GET /api/staff — search (name/email), isActive filter, pagination. */
const listStaff = asyncHandler(async (req, res) => {
  const { search, isActive } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = { role: ROLES.STAFF };
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) Object.assign(filter, nameSearchFilter(search, ['email']));

  const sort = parseSort(req.query.sort, SORT_FIELDS, { createdAt: -1 });
  const [staff, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, staff, { pagination: buildPagination(page, limit, total) });
});

/** POST /api/staff — the role is forced to "staff". */
const createStaff = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['firstName', 'lastName', 'email', 'password', 'phone']);

  if (await User.exists({ email: data.email })) {
    throw ApiError.conflict('Email is already registered');
  }

  const staff = await User.create({ ...data, role: ROLES.STAFF });
  sendSuccess(res, staff, { status: 201, message: 'Staff account created successfully' });
});

/** PUT /api/staff/:id — staff cannot deactivate their own account. */
const updateStaff = asyncHandler(async (req, res) => {
  if (isSelf(req) && req.body.isActive === false) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  const staff = await findStaff(req.params.id);
  const updates = pick(req.body, ['firstName', 'lastName', 'email', 'phone', 'isActive', 'password']);

  if (updates.email && updates.email !== staff.email && (await User.exists({ email: updates.email }))) {
    throw ApiError.conflict('Email is already registered');
  }

  Object.assign(staff, updates);
  await staff.save();

  sendSuccess(res, staff, { message: 'Staff account updated successfully' });
});

/** DELETE /api/staff/:id — staff cannot delete their own account. */
const deleteStaff = asyncHandler(async (req, res) => {
  if (isSelf(req)) throw ApiError.badRequest('You cannot delete your own account');

  const staff = await findStaff(req.params.id);
  await staff.deleteOne();

  sendSuccess(res, null, { message: 'Staff account deleted successfully' });
});

module.exports = { listStaff, createStaff, updateStaff, deleteStaff };
