import api from './axios';

// Profile endpoints for the logged-in user (patient or staff).

/** PUT /users/me → data: updated user */
export const updateProfile = (payload) => api.put('/users/me', payload).then((res) => res.data);

/** PUT /users/me/password  body: { currentPassword, newPassword, confirmPassword } */
export const changePassword = (payload) =>
  api.put('/users/me/password', payload).then((res) => res.data);
