import axios from 'axios';

/** sessionStorage key that holds the JWT (session-scoped for security). */
export const TOKEN_KEY = 'smilecare_token';

/** Name of the window event fired when the API rejects our token (HTTP 401). */
export const UNAUTHORIZED_EVENT = 'smilecare:unauthorized';

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  // Clear any legacy persistent token in localStorage so past test sessions don't linger
  try {
    if (localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors (e.g. storage disabled/blocked)
  }
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore storage errors
  }
};

export const clearToken = () => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore storage errors
  }
};

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
