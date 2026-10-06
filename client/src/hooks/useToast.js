import { useContext } from 'react';
import { ToastContext } from '../context/contexts';

/**
 * Show notifications: `const { showToast } = useToast();`
 * `showToast({ type: 'success', message: 'Appointment booked!' })`
 * @returns {{ showToast: (opts: { type?: 'success'|'danger'|'info'|'warning', message: string, title?: string, delay?: number }) => void }}
 */
export default function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
