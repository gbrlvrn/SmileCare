import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import { AuthModalContext } from './contexts';

/**
 * Global provider for the Authentication Pop-up (Login & Sign Up).
 * Allows any component in the application to open the login or register modal
 * without navigating away from the current page.
 */
export function AuthModalProvider({ children }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalMode, setInternalMode] = useState('login');
  const [redirectPath, setRedirectPath] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const authParam = searchParams.get('auth');
  const isLoggingOutActive = typeof window !== 'undefined' && sessionStorage.getItem('smilecare_logging_out') === '1';
  const hasQueryAuth = !isLoggingOutActive && (authParam === 'login' || authParam === 'register');

  // Derived state: open if explicitly triggered or if requested via URL param (?auth=login/register)
  const isOpen = !isLoggingOutActive && (internalOpen || hasQueryAuth);
  const mode = internalOpen ? internalMode : hasQueryAuth ? authParam : internalMode;

  const openLogin = useCallback((options = {}) => {
    setInternalMode('login');
    setRedirectPath(options.redirectPath ?? null);
    setInternalOpen(true);
  }, []);

  const openRegister = useCallback((options = {}) => {
    setInternalMode('register');
    setRedirectPath(options.redirectPath ?? null);
    setInternalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setInternalOpen(false);
    setRedirectPath(null);

    // Clean up ?auth and ?session params from the URL if present
    if (searchParams.get('auth') || searchParams.get('session')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('auth');
      nextParams.delete('session');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const value = useMemo(
    () => ({
      isOpen,
      mode,
      setMode: setInternalMode,
      openLogin,
      openRegister,
      closeModal,
    }),
    [isOpen, mode, openLogin, openRegister, closeModal],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal
        show={isOpen}
        mode={mode}
        setMode={setInternalMode}
        onHide={closeModal}
        redirectPath={redirectPath}
      />
    </AuthModalContext.Provider>
  );
}
