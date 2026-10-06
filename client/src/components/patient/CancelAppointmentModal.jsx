import { useState } from 'react';
import { Alert } from 'react-bootstrap';
import { updateAppointmentStatus } from '../../api/appointmentApi';
import { getErrorMessage } from '../../api/errors';
import ConfirmModal from '../ConfirmModal';
import FormInput from '../FormInput';
import useToast from '../../hooks/useToast';
import { formatDate, formatTime } from '../../utils/formatters';
import { serviceLabel } from './appointmentRules';

const REASON_MAX = 500;

/**
 * "Cancel appointment?" dialog with an optional reason.
 * Render it only while needed: {target && <CancelAppointmentModal appointment={target} ... />}
 * so the reason field starts empty every time it opens.
 *
 * @param {object} props
 * @param {object} props.appointment the appointment to cancel
 * @param {() => void} props.onClose closes the dialog without changes
 * @param {() => void} props.onCancelled called after the server cancelled it (e.g. refetch the list)
 */
export default function CancelAppointmentModal({ appointment, onClose, onCancelled }) {
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      await updateAppointmentStatus(appointment._id, 'cancelled', reason.trim());
      showToast({ type: 'success', message: 'Your appointment has been cancelled.' });
      onCancelled();
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <ConfirmModal
      show
      title="Cancel this appointment?"
      body={
        <>
          <strong className="text-body">{serviceLabel(appointment.service)}</strong> on{' '}
          {formatDate(appointment.date, { weekday: 'short' })} at {formatTime(appointment.startTime)} will be
          cancelled. This cannot be undone.
        </>
      }
      confirmText="Cancel appointment"
      cancelText="Keep appointment"
      onConfirm={handleConfirm}
      onCancel={onClose}
      loading={submitting}
    >
      {error && (
        <Alert variant="danger" className="small mt-3 mb-0">
          {error}
        </Alert>
      )}
      <FormInput
        label="Reason (optional)"
        name="cancellationReason"
        id="cancel-reason"
        as="textarea"
        rows={3}
        maxLength={REASON_MAX}
        showCount
        placeholder="Let the clinic know why you are cancelling"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={submitting}
        groupClassName="mt-3 mb-0"
      />
    </ConfirmModal>
  );
}
