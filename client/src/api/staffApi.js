import api from './axios';

// Staff-only staff account management.

/** GET /staff — { page?, limit?, search?, sort? } */
export const getStaff = (params = {}) => api.get('/staff', { params }).then((res) => res.data);

/** POST /staff — { firstName, lastName, email, password, phone? } */
export const createStaff = (payload) => api.post('/staff', payload).then((res) => res.data);

/** PUT /staff/:id — { firstName?, lastName?, phone?, isActive?, password? } */
export const updateStaff = (id, payload) => api.put(`/staff/${id}`, payload).then((res) => res.data);

/** DELETE /staff/:id — cannot delete yourself */
export const deleteStaff = (id) => api.delete(`/staff/${id}`).then((res) => res.data);
