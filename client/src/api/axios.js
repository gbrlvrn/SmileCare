import axios from 'axios';

/** localStorage key that holds the JWT. */
export const TOKEN_KEY = 'smilecare_token';

/** Name of the window event fired when the API rejects our token (HTTP 401). */
export const UNAUTHORIZED_EVENT = 'smilecare:unauthorized';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Shared axios instance used by every file in `src/api/`.
 * - baseURL comes from the Vite env variable VITE_API_URL
 * - a 15 s timeout avoids requests hanging forever
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach "Authorization: Bearer <token>" when logged in.
// `synchronous: true` reads the token immediately when the request is made.
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  null,
  { synchronous: true },
);

// Response interceptor: if the token is expired/invalid on a normal endpoint,
// clear it and tell AuthContext (which redirects to /login?session=expired).
// Auth endpoints (/auth/login, /auth/register, /auth/me) are skipped because
// their 401s are handled by the calling code (e.g. "Invalid email or password").
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthEndpoint = url.startsWith('/auth/');

    if (status === 401 && !isAuthEndpoint && getToken()) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

export default api;
