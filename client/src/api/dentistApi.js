import api from './axios';

/**
 * GET /dentists
 * @param {{ page?, limit?, search?, sort?, all? }} [params]
 *   Omit `page` to get every active dentist as a plain array (no pagination).
 *   Staff can pass `all: true` to include inactive dentists.
 */
export const getDentists = (params = {}) => api.get('/dentists', { params }).then((res) => res.data);

/** GET /dentists/:id */
export const getDentist = (id) => api.get(`/dentists/${id}`).then((res) => res.data);

/**
 * GET /dentists/:id/availability
 * @param {string} id dentist id
 * @param {{ date: string, serviceId: string, excludeAppointmentId?: string }} params
 * @returns envelope with data: { date, dentistId, serviceId, slots: [{ startTime, endTime, available }] }
 */
export const getAvailability = (id, params) =>
  api.get(`/dentists/${id}/availability`, { params }).then((res) => res.data);

/** POST /dentists (staff) */
export const createDentist = (payload) => api.post('/dentists', payload).then((res) => res.data);

/** PUT /dentists/:id (staff) — partial update */
export const updateDentist = (id, payload) =>
  api.put(`/dentists/${id}`, payload).then((res) => res.data);

/** DELETE /dentists/:id (staff) */
export const deleteDentist = (id) => api.delete(`/dentists/${id}`).then((res) => res.data);
