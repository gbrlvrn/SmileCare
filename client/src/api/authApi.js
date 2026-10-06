import api from './axios';

// Every function returns the response envelope: { success, data, message?, pagination? }

/** POST /auth/register → data: { token, user } */
export const register = (payload) => api.post('/auth/register', payload).then((res) => res.data);

/** POST /auth/login → data: { token, user } */
export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((res) => res.data);

/** GET /auth/me → data: user */
export const getMe = () => api.get('/auth/me').then((res) => res.data);

/** POST /auth/logout → message */
export const logout = () => api.post('/auth/logout').then((res) => res.data);
