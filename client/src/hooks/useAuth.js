import { useContext } from 'react';
import { AuthContext } from '../context/contexts';

/**
 * Access the auth state anywhere inside <AuthProvider>.
 * @returns {{ user, token, isAuthenticated, loading, login, register, logout, updateUser }}
 */
export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
