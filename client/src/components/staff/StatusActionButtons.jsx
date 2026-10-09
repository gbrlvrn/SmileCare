import { Button, Spinner } from 'react-bootstrap';
import { STATUS_ACTIONS, getAllowedStatuses } from './staffUtils';

/**
 * Buttons for the status changes allowed from the appointment's current status.
 * @param {object} props
 * @param {object} props.appointment
 * @param {(appointment: object, status: string) => void} props.onChange usually useAppointmentActions().changeStatus
 * @param {boolean} [props.busy] shows a spinner and disables the buttons
 * @param {string[]} [props.only] limit to these target statuses (e.g. ['confirmed', 'completed'])
 * @param {'sm'|'lg'} [props.size]
 * @param {string} [props.className]
 */
const SHORT_LABELS = {
  confirmed: 'Confirm',
  completed: 'Complete',
  'no-show': 'No-show',
  cancelled: 'Cancel',
};

export default function StatusActionButtons({
  appointment,
  onChange,
  busy = false,
  only,
  size = 'sm',
  className = '',
  shortLabels = false,
}) {
  const statuses = getAllowedStatuses(appointment.status).filter((s) => !only || only.includes(s));
  if (statuses.length === 0) return null;

  return (
    <div className={`d-flex align-items-center flex-nowrap gap-1.5 ${className}`}>
      {statuses.map((status) => {
        const action = STATUS_ACTIONS[status];
        const Icon = action.icon;
        const outline = status === 'cancelled' || status === 'no-show';
        const labelText = shortLabels ? (SHORT_LABELS[status] || action.label) : action.label;
        return (
          <Button
            key={status}
            size={size}
            variant={outline ? `outline-${action.variant}` : action.variant}
            disabled={busy}
            onClick={() => onChange(appointment, status)}
            className="text-nowrap d-inline-flex align-items-center py-1 px-2"
            style={{ fontSize: '0.78rem' }}
          >
            {busy ? (
              <Spinner size="sm" animation="border" className="me-1" aria-hidden="true" />
            ) : (
              <Icon className="me-1" aria-hidden="true" />
            )}
            {labelText}
          </Button>
        );
      })}
    </div>
  );
}
