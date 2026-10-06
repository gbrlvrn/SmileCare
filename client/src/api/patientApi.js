import api from './axios';

// Staff-only patient management.

/** GET /patients — { page?, limit?, search?, isActive?, sort? }; items include appointmentCount */
export const getPatients = (params = {}) => api.get('/patients', { params }).then((res) => res.data);

/** GET /patients/:id → data: { patient, appointments } */
export const getPatient = (id) => api.get(`/patients/${id}`).then((res) => res.data);

/** POST /patients — walk-in registration */
export const createPatient = (payload) => api.post('/patients', payload).then((res) => res.data);

/** PUT /patients/:id — profile fields, isActive, optional password reset */
export const updatePatient = (id, payload) =>
  api.put(`/patients/${id}`, payload).then((res) => res.data);

/** DELETE /patients/:id — also deletes their appointments */
export const deletePatient = (id) => api.delete(`/patients/${id}`).then((res) => res.data);
