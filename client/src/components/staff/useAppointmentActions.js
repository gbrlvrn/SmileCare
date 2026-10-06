import { useState } from 'react';
import { updateAppointmentStatus } from '../../api/appointmentApi';
import { getErrorMessage } from '../../api/errors';
import useToast from '../../hooks/useToast';
import { STATUS_ACTIONS } from './staffUtils';

const CLOSED = { show: false, appointment: null, status: null };

/**
 * Changes appointment statuses from any staff page.
 * Simple actions (Confirm, Mark completed) run immediately; risky ones
 * (No-show, Cancel) first open a dialog — render it with <StatusChangeModal {...modalProps} />.
 *
 * @example
 * const actions = useAppointmentActions({ onChanged: refetch });
 * <Button onClick={() => actions.changeStatus(appointment, 'confirmed')}>Confirm</Button>
 * <StatusChangeModal {...actions.modalProps} />
 *
 * @param {{ onChanged?: (updated: object) => void }} [options] called after a successful change
 * @returns {{ changeStatus: (appointment, status) => void, busyId: string|null, modalProps: object }}
 */
export default function useAppointmentActions({ onChanged } = {}) {
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState(null); // id of the appointment being updated
  const [dialog, setDialog] = useState(CLOSED);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  /** Sends PATCH /appointments/:id/status. Returns true on success. */
  const applyStatus = async (appointment, status, cancellationReason) => {
    setBusyId(appointment._id);
    setError('');
    try {
      const res = await updateAppointmentStatus(appointment._id, status, cancellationReason);
      showToast({ type: 'success', message: STATUS_ACTIONS[status]?.success || 'Status updated.' });
      setDialog((prev) => ({ ...prev, show: false }));
      onChanged?.(res.data);
    } catch (err) {
      const message = getErrorMessage(err);
      // Inside the dialog → show the error there; otherwise use a toast.
      if (STATUS_ACTIONS[status]?.confirm) setError(message);
      else showToast({ type: 'danger', message });
    } finally {
      setBusyId(null);
    }
  };

  /** Starts a status change (asks for confirmation when the action requires it). */
  const changeStatus = (appointment, status) => {
    if (STATUS_ACTIONS[status]?.confirm) {
      setReason('');
      setError('');
      setDialog({ show: true, appointment, status });
    } else {
      applyStatus(appointment, status);
    }
  };

  const modalProps = {
    show: dialog.show,
    status: dialog.status,
    appointment: dialog.appointment,
    reason,
    onReasonChange: setReason,
    error,
    loading: Boolean(dialog.appointment) && busyId === dialog.appointment._id,
    onConfirm: () => applyStatus(dialog.appointment, dialog.status, reason.trim()),
    onCancel: () => setDialog((prev) => ({ ...prev, show: false })),
  };

  return { changeStatus, busyId, modalProps };
}
