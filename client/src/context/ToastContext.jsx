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
  error: XCircleFill,
  warning: ExclamationTriangleFill,
  info: InfoCircleFill,
};

const TITLES = {
  success: 'Success',
  danger: 'Error',
  error: 'Error',
  warning: 'Warning',
  info: 'Notice',
};

let nextId = 1;

/**
 * Individual animated toast item with smooth slide-in, progress bar, and smooth exit dismissal.
 */
function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 280);
  }, [isExiting, onRemove, toast.id]);

  const rawType = toast.type === 'error' ? 'danger' : toast.type || 'info';
  const Icon = ICONS[rawType] || InfoCircleFill;
  const hasDelay = Boolean(toast.delay && toast.delay > 0);

  return (
    <Toast
      animation={false}
      onClose={handleClose}
      autohide={hasDelay}
      delay={toast.delay || 4000}
      className={`sc-toast sc-toast-${rawType} ${isExiting ? 'is-exiting' : ''}`}
    >
      <Toast.Header closeLabel="Close notification">
        <span className="sc-toast-icon-badge" aria-hidden="true">
          <Icon />
        </span>
        <strong className="me-auto sc-toast-title">
          {toast.title || TITLES[rawType] || 'Notice'}
        </strong>
      </Toast.Header>
      <Toast.Body className="sc-toast-body">{toast.message}</Toast.Body>
      {hasDelay && (
        <div
          className="sc-toast-progress-bar"
          style={{ animationDuration: `${toast.delay}ms` }}
          aria-hidden="true"
        />
      )}
    </Toast>
  );
}

/**
 * Provides `showToast({ type, message, title?, delay? })` to the whole app.
 * - type: 'success' | 'danger' | 'warning' | 'info' (default 'info')
 * - delay: ms before auto-hide (default 4000)
 * Toasts stack in the top-right corner with smooth entrance and exit animations.
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
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}
