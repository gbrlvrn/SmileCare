import api from './axios';

/**
 * GET /appointments
 * @param {{ page?, limit?, search?, status?, dentist?, from?, to?, upcoming?, sort? }} [params]
 * Patients only receive their own appointments; staff receive all.
 */
export const getAppointments = (params = {}) =>
  api.get('/appointments', { params }).then((res) => res.data);

/** GET /appointments/:id */
export const getAppointment = (id) => api.get(`/appointments/${id}`).then((res) => res.data);

/**
 * POST /appointments
 * Patient body: { dentist, service, date, startTime, reason? }
 * Staff body:   same + patient (required) and optional status: 'confirmed'
 */
export const createAppointment = (payload) =>
  api.post('/appointments', payload).then((res) => res.data);

/** PUT /appointments/:id — reschedule/edit: { dentist?, service?, date?, startTime?, reason? } */
export const updateAppointment = (id, payload) =>
  api.put(`/appointments/${id}`, payload).then((res) => res.data);

/** PATCH /appointments/:id/status — { status, cancellationReason? } */
export const updateAppointmentStatus = (id, status, cancellationReason) =>
  api
    .patch(`/appointments/${id}/status`, {
      status,
      ...(cancellationReason ? { cancellationReason } : {}),
    })
    .then((res) => res.data);

/** PUT /appointments/:id/treatment (staff) — { diagnosis, procedure, notes?, prescription?, followUpDate? } */
export const saveTreatment = (id, payload) =>
  api.put(`/appointments/${id}/treatment`, payload).then((res) => res.data);

/** DELETE /appointments/:id (staff) */
export const deleteAppointment = (id) => api.delete(`/appointments/${id}`).then((res) => res.data);
