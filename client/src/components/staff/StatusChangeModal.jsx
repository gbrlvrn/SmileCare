import { Alert, Form } from 'react-bootstrap';
import ConfirmModal from '../ConfirmModal';
import { formatDate, formatTime, fullName } from '../../utils/formatters';
import { STATUS_ACTIONS } from './staffUtils';
import { validateCancellationReason } from './staffValidators';

/**
 * Confirmation dialog for risky status changes (No-show, Cancel).
 * Receives its props from `useAppointmentActions().modalProps`.
 * @param {object} props
 * @param {boolean} props.show
 * @param {string|null} props.status target status, e.g. 'cancelled'
 * @param {object|null} props.appointment
 * @param {string} props.reason cancellation reason (controlled)
 * @param {(value: string) => void} props.onReasonChange
 * @param {string} [props.error] API error message
 * @param {boolean} [props.loading]
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
export default function StatusChangeModal({
  show,
  status,
  appointment,
  reason,
  onReasonChange,
  error,
  loading,
  onConfirm,
  onCancel,
}) {
  const action = STATUS_ACTIONS[status] || {};
  const reasonError = action.needsReason ? validateCancellationReason(reason) : '';

  return (
    <ConfirmModal
      show={show}
      title={action.title || 'Change status?'}
      confirmText={action.label || 'Confirm'}
      variant={action.variant === 'secondary' ? 'dark' : action.variant || 'primary'}
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
      confirmDisabled={Boolean(reasonError)}
      body={
        <>
          {appointment && (
            <p className="mb-2">
              <strong className="text-body">{fullName(appointment.patient) || 'Patient'}</strong> ·{' '}
              {formatDate(appointment.date)} at {formatTime(appointment.startTime)}
            </p>
          )}
          <p className="mb-0">{action.body}</p>
        </>
      }
    >
      {action.needsReason && (
        <Form.Group className="mt-3" controlId="cancellation-reason">
          <Form.Label>Reason (optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            maxLength={300}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            isInvalid={Boolean(reasonError)}
            placeholder="e.g. Patient requested to cancel by phone"
          />
          <Form.Control.Feedback type="invalid">{reasonError}</Form.Control.Feedback>
          <Form.Text muted>{reason.length}/300</Form.Text>
        </Form.Group>
      )}
      {error && (
        <Alert variant="danger" className="small mt-3 mb-0">
          {error}
        </Alert>
      )}
    </ConfirmModal>
  );
}
