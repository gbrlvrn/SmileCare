import { useContext } from 'react';
import { AuthModalContext } from '../context/contexts';

/**
 * Hook to trigger the Auth Modal (Sign In / Sign Up popup) from any component.
 *
 * Usage:
 *   const { openLogin, openRegister, closeModal } = useAuthModal();
 *   openLogin(); // opens in Sign In mode
 *   openLogin({ redirectPath: '/patient/book' }); // opens and navigates after login
 *   openRegister(); // opens in Create Account mode
 */
export default function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}
