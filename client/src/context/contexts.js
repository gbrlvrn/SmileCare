import { createContext } from 'react';

/**
 * React context objects live in their own file so that the provider files
 * (AuthContext.jsx, ToastContext.jsx) only export components. This keeps
 * Vite's Fast Refresh working. Read them with the hooks `useAuth()` / `useToast()`.
 */
export const AuthContext = createContext(null);
export const ToastContext = createContext(null);
