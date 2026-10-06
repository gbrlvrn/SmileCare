const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Dentist = require('../models/Dentist');
const Service = require('../models/Service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { clinicNow, addDays } = require('../utils/time');
const { APPOINTMENT_POPULATE, upcomingFilter } = require('../services/appointment.service');
const { APPOINTMENT_STATUSES, ROLES } = require('../config/constants');

const TREND_DAYS = 14;

/**
 * GET /api/dashboard/patient
 * { nextAppointment, counts: { upcoming, completed, cancelled, total }, recentAppointments }
 */
const patientDashboard = asyncHandler(async (req, res) => {
  const patient = req.user._id;
  const upcoming = { patient, ...upcomingFilter() };

  const [nextAppointment, upcomingCount, completed, cancelled, total, recentAppointments] = await Promise.all([
    Appointment.findOne(upcoming).sort({ date: 1, startTime: 1 }).populate(APPOINTMENT_POPULATE),
    Appointment.countDocuments(upcoming),
    Appointment.countDocuments({ patient, status: 'completed' }),
    Appointment.countDocuments({ patient, status: 'cancelled' }),
    Appointment.countDocuments({ patient }),
    Appointment.find({ patient }).sort({ date: -1, startTime: -1 }).limit(5).populate(APPOINTMENT_POPULATE),
  ]);

  sendSuccess(res, {
    nextAppointment,
    counts: { upcoming: upcomingCount, completed, cancelled, total },
    recentAppointments,
  });
});

/**
 * GET /api/dashboard/staff
 * { totals, statusCounts, todaySchedule, trend (14 days, zero-filled), topServices (top 5) }
 * Cancelled appointments are excluded from today's schedule, the trend and top services.
 */
const staffDashboard = asyncHandler(async (req, res) => {
  const today = clinicNow().date;
  const trendStart = addDays(today, -(TREND_DAYS - 1));
  const notCancelled = { status: { $ne: 'cancelled' } };

  const [patients, dentists, services, statusAgg, todaySchedule, trendAgg, topServices] = await Promise.all([
    User.countDocuments({ role: ROLES.PATIENT }),
    Dentist.countDocuments({ isActive: true }),
    Service.countDocuments({ isActive: true }),
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Appointment.find({ date: today, ...notCancelled }).sort({ startTime: 1 }).populate(APPOINTMENT_POPULATE),
    Appointment.aggregate([
      { $match: { date: { $gte: trendStart, $lte: today }, ...notCancelled } },
      { $group: { _id: '$date', count: { $sum: 1 } } },
    ]),
    Appointment.aggregate([
      { $match: notCancelled },
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: Service.collection.name, localField: '_id', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
      { $project: { _id: 0, serviceId: '$_id', name: '$service.name', count: 1 } },
    ]),
  ]);

  // Every status is present, defaulting to 0.
  const statusCounts = Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s, 0]));
  statusAgg.forEach(({ _id, count }) => {
    if (_id in statusCounts) statusCounts[_id] = count;
  });

  // One entry per day for the last 14 days (including today), 0 when there were none.
  const countByDate = new Map(trendAgg.map(({ _id, count }) => [_id, count]));
  const trend = Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = addDays(trendStart, i);
    return { date, count: countByDate.get(date) || 0 };
  });

  sendSuccess(res, {
    totals: {
      patients,
      dentists,
      services,
      appointmentsToday: todaySchedule.length,
      pending: statusCounts.pending,
    },
    statusCounts,
    todaySchedule,
    trend,
    topServices,
  });
});

module.exports = { patientDashboard, staffDashboard };
