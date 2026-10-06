import { ROLE_HOME } from './constants';

/**
 * Home/dashboard path for a user (or '/' if unknown).
 * @param {{ role?: string } | null} user
 */
export const getHomePath = (user) => ROLE_HOME[user?.role] || '/';

/**
 * Decides where to send a user after login/register.
 * Goes back to the page they originally wanted (`from`) only if that page
 * belongs to their role; otherwise goes to their dashboard.
 * @param {{ role: string }} user
 * @param {{ pathname?: string, search?: string } | undefined} from location saved by ProtectedRoute
 */
export function getPostLoginPath(user, from) {
  const home = getHomePath(user);
  const pathname = from?.pathname;
  if (pathname && (pathname === home || pathname.startsWith(`${home}/`))) {
    return pathname + (from.search || '');
  }
  return home;
}
