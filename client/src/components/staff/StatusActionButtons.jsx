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
export default function StatusActionButtons({ appointment, onChange, busy = false, only, size, className = '' }) {
  const statuses = getAllowedStatuses(appointment.status).filter((s) => !only || only.includes(s));
  if (statuses.length === 0) return null;

  return (
    <div className={`d-flex flex-wrap gap-2 ${className}`}>
      {statuses.map((status) => {
        const action = STATUS_ACTIONS[status];
        const Icon = action.icon;
        const outline = status === 'cancelled' || status === 'no-show';
        return (
          <Button
            key={status}
            size={size}
            variant={outline ? `outline-${action.variant}` : action.variant}
            disabled={busy}
            onClick={() => onChange(appointment, status)}
          >
            {busy ? (
              <Spinner size="sm" animation="border" className="me-1" aria-hidden="true" />
            ) : (
              <Icon className="me-1" aria-hidden="true" />
            )}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
