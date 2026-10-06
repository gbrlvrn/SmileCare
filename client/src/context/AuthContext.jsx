import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/authApi';
import { clearToken, getToken, setToken, UNAUTHORIZED_EVENT } from '../api/axios';
import Loader from '../components/Loader';
import { AuthContext } from './contexts';

/**
 * Provides the logged-in user to the whole app.
 *
 * Value: { user, token, isAuthenticated, loading, login, register, logout, updateUser }
 * - On first load, if a token is saved in localStorage we call GET /auth/me to
 *   restore the user (a full-page loader is shown meanwhile).
 * - Listens for the axios "unauthorized" event (expired token) and sends the user
 *   to /login?session=expired.
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // Restore the session on page refresh.
  useEffect(() => {
    if (!getToken()) return undefined;
    let ignore = false;

    authApi
      .getMe()
      .then((res) => {
        if (!ignore) setUser(res.data);
      })
      .catch((err) => {
        if (ignore) return;
        // Token rejected → forget it. (On a network error we keep the token so a refresh can retry.)
        if (err.response?.status === 401 || err.response?.status === 404) {
          clearToken();
          setTokenState(null);
        }
        setUser(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // React to 401 responses detected by the axios interceptor.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setTokenState(null);
      const from = { pathname: window.location.pathname, search: window.location.search };
      navigate('/login?session=expired', { replace: true, state: { from } });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [navigate]);

  /** Saves the session returned by login/register. */
  const startSession = useCallback(({ token: newToken, user: newUser }) => {
    setToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  /** Logs in and returns the user. Throws the axios error on failure. */
  const login = useCallback(
    async (email, password) => {
      const res = await authApi.login(email, password);
      return startSession(res.data);
    },
    [startSession],
  );

  /** Registers a patient, logs them in and returns the user. Throws on failure. */
  const register = useCallback(
    async (payload) => {
      const res = await authApi.register(payload);
      return startSession(res.data);
    },
    [startSession],
  );

  /** Clears the session and goes to the login page. */
  const logout = useCallback(() => {
    // Tell the server (stateless JWT, so failures don't matter).
    authApi.logout().catch(() => {});
    clearToken();
    setTokenState(null);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  /** Replaces the stored user (e.g. after editing the profile). */
  const updateUser = useCallback((nextUser) => setUser(nextUser), []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      loading,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, token, loading, login, register, logout, updateUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Loader fullPage label="Loading your session…" /> : children}
    </AuthContext.Provider>
  );
}
