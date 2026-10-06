import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getPostLoginPath } from '../utils/redirect';

/**
 * For pages only guests should see (login, register).
 * Signed-in users are sent to the page they originally wanted (`state.from`,
 * if their role may open it) or to their dashboard. This also performs the
 * redirect right after a successful login/register.
 */
export default function GuestRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={getPostLoginPath(user, location.state?.from)} replace />;
  }
  return children ?? <Outlet />;
}
