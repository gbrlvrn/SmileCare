const Service = require('../models/Service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, pick } = require('../utils/response');
const { getPagination, buildPagination, parseSort } = require('../utils/pagination');
const { escapeRegex, searchRegex } = require('../utils/escapeRegex');
const { hasUpcomingAppointments } = require('../services/appointment.service');

const SERVICE_FIELDS = ['name', 'description', 'durationMinutes', 'price', 'isActive'];
const SORT_FIELDS = ['name', 'price', 'durationMinutes', 'createdAt'];

const isStaff = (req) => req.user && req.user.role === 'staff';

/** Throws 409 if another service already uses this name (case-insensitive). */
async function assertUniqueName(name, excludeId) {
  const filter = { name: new RegExp(`^${escapeRegex(name)}$`, 'i') };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Service.exists(filter)) throw ApiError.conflict('A service with this name already exists');
}

/**
 * GET /api/services
 * Public: active services only. Staff may add ?all=true to include inactive ones.
 * Without ?page the full array is returned (for dropdowns); with ?page it is paginated.
 */
const listServices = asyncHandler(async (req, res) => {
  const { search, all } = req.query;

  const filter = isStaff(req) && all === 'true' ? {} : { isActive: true };
  if (search) {
    const regex = searchRegex(search);
    filter.$or = [{ name: regex }, { description: regex }];
  }
  const sort = parseSort(req.query.sort, SORT_FIELDS, { name: 1 });

  if (req.query.page === undefined) {
    return sendSuccess(res, await Service.find(filter).sort(sort));
  }

  const { page, limit, skip } = getPagination(req.query);
  const [services, total] = await Promise.all([
    Service.find(filter).sort(sort).skip(skip).limit(limit),
    Service.countDocuments(filter),
  ]);
  return sendSuccess(res, services, { pagination: buildPagination(page, limit, total) });
});

/** GET /api/services/:id — inactive services are only visible to staff. */
const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service || (!service.isActive && !isStaff(req))) throw ApiError.notFound('Service not found');
  sendSuccess(res, service);
});

/** POST /api/services */
const createService = asyncHandler(async (req, res) => {
  const data = pick(req.body, SERVICE_FIELDS);
  await assertUniqueName(data.name);

  const service = await Service.create(data);
  sendSuccess(res, service, { status: 201, message: 'Service created successfully' });
});

/** PUT /api/services/:id — partial update. */
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw ApiError.notFound('Service not found');

  const updates = pick(req.body, SERVICE_FIELDS);
  if (updates.name) await assertUniqueName(updates.name, service._id);

  Object.assign(service, updates);
  await service.save();
  sendSuccess(res, service, { message: 'Service updated successfully' });
});

/** DELETE /api/services/:id — blocked while upcoming appointments use the service. */
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw ApiError.notFound('Service not found');

  if (await hasUpcomingAppointments('service', service._id)) {
    throw ApiError.badRequest(
      'This service has upcoming appointments and cannot be deleted. Deactivate it instead.'
    );
  }

  await service.deleteOne();
  sendSuccess(res, null, { message: 'Service deleted successfully' });
});

module.exports = { listServices, getService, createService, updateService, deleteService };
