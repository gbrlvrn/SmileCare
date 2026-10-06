import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Only lets signed-in users through. Guests are sent to /login and the page they
 * wanted is saved in `state.from` so Login can bring them back afterwards.
 * Use as a layout route (renders <Outlet />) or wrap children.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children ?? <Outlet />;
}
