import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Only lets users with one of the given roles through; others are sent to the home page.
 * Place it inside <ProtectedRoute> (it assumes a user is logged in).
 * @param {object} props
 * @param {string[]} props.roles e.g. ['staff']
 */
export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children ?? <Outlet />;
}
