import api from './axios';

/** GET /dashboard/patient → data: { nextAppointment, counts, recentAppointments } */
export const getPatientDashboard = () => api.get('/dashboard/patient').then((res) => res.data);

/** GET /dashboard/staff → data: { totals, statusCounts, todaySchedule, trend, topServices } */
export const getStaffDashboard = () => api.get('/dashboard/staff').then((res) => res.data);
