import { useCallback, useMemo, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import {
  CheckCircleFill,
  ExclamationTriangleFill,
  InfoCircleFill,
  XCircleFill,
} from 'react-bootstrap-icons';
import { ToastContext } from './contexts';

const ICONS = {
  success: CheckCircleFill,
  danger: XCircleFill,
  warning: ExclamationTriangleFill,
  info: InfoCircleFill,
};

const TITLES = {
  success: 'Success',
  danger: 'Error',
  warning: 'Warning',
  info: 'Notice',
};

let nextId = 1;

/**
 * Provides `showToast({ type, message, title?, delay? })` to the whole app.
 * - type: 'success' | 'danger' | 'info' | 'warning' (default 'info')
 * - delay: ms before auto-hide (default 4000)
 * Toasts stack in the top-right corner.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((options) => {
    const { type = 'info', message = '', title, delay = 4000 } =
      typeof options === 'string' ? { message: options } : options || {};
    setToasts((current) => [...current, { id: nextId++, type, message, title, delay }]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position="top-end" containerPosition="fixed" className="p-3 sc-toast-container">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || InfoCircleFill;
          return (
            <Toast
              key={toast.id}
              onClose={() => removeToast(toast.id)}
              autohide
              delay={toast.delay}
              className={`sc-toast sc-toast-${toast.type}`}
            >
              <Toast.Header closeLabel="Close notification">
                <Icon className={`me-2 text-${toast.type}`} aria-hidden="true" />
                <strong className="me-auto">{toast.title || TITLES[toast.type] || 'Notice'}</strong>
              </Toast.Header>
              <Toast.Body>{toast.message}</Toast.Body>
            </Toast>
          );
        })}
      </ToastContainer>
    </ToastContext.Provider>
  );
}
