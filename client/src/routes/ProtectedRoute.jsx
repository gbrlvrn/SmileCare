import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Only lets signed-in users through. Guests are sent to /login and the page they
 * wanted is saved in `state.from` so Login can bring them back afterwards.
 * Use as a layout route (renders <Outlet />) or wrap children.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoggingOut } = useAuth();
  const location = useLocation();

  if (isLoggingOut || (typeof window !== 'undefined' && sessionStorage.getItem('smilecare_logging_out') === '1')) {
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/?auth=login" replace state={{ from: location }} />;
  }
  return children ?? <Outlet />;
}
