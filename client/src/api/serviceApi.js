import api from './axios';

/**
 * GET /services
 * @param {{ page?, limit?, search?, sort?, all? }} [params]
 *   Omit `page` to get every active service as a plain array (no pagination).
 *   Staff can pass `all: true` to include inactive services.
 */
export const getServices = (params = {}) => api.get('/services', { params }).then((res) => res.data);

/** GET /services/:id */
export const getService = (id) => api.get(`/services/${id}`).then((res) => res.data);

/** POST /services (staff)  body: { name, description?, durationMinutes, price, isActive? } */
export const createService = (payload) => api.post('/services', payload).then((res) => res.data);

/** PUT /services/:id (staff) — partial update */
export const updateService = (id, payload) =>
  api.put(`/services/${id}`, payload).then((res) => res.data);

/** DELETE /services/:id (staff) */
export const deleteService = (id) => api.delete(`/services/${id}`).then((res) => res.data);
