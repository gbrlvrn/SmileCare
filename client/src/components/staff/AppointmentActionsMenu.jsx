import { Dropdown } from 'react-bootstrap';
import { Eye, ThreeDots, Trash } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { STATUS_ACTIONS, getAllowedStatuses } from './staffUtils';

/**
 * "⋯" row menu for an appointment: View, the valid status changes and Delete.
 * Uses react-bootstrap's Dropdown, which is keyboard accessible (Enter/Space, arrows, Esc).
 * @param {object} props
 * @param {object} props.appointment
 * @param {(appointment: object, status: string) => void} props.onStatusChange
 * @param {(appointment: object) => void} props.onDelete
 * @param {boolean} [props.disabled]
 */
export default function AppointmentActionsMenu({ appointment, onStatusChange, onDelete, disabled = false }) {
  const statuses = getAllowedStatuses(appointment.status);

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="light"
        size="sm"
        className="sc-icon-toggle"
        disabled={disabled}
        aria-label={`Actions for appointment of ${appointment.patient?.fullName || 'patient'}`}
      >
        <ThreeDots aria-hidden="true" />
      </Dropdown.Toggle>
      {/* fixed strategy: the menu is not clipped by the scrollable table wrapper */}
      <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
        <Dropdown.Item as={Link} to={`/staff/appointments/${appointment._id}`}>
          <Eye className="me-2" aria-hidden="true" />
          View details
        </Dropdown.Item>
        {statuses.length > 0 && <Dropdown.Divider />}
        {statuses.map((status) => {
          const action = STATUS_ACTIONS[status];
          const Icon = action.icon;
          return (
            <Dropdown.Item key={status} as="button" onClick={() => onStatusChange(appointment, status)}>
              <Icon className={`me-2 text-${action.variant}`} aria-hidden="true" />
              {action.label}
            </Dropdown.Item>
          );
        })}
        <Dropdown.Divider />
        <Dropdown.Item as="button" className="text-danger" onClick={() => onDelete(appointment)}>
          <Trash className="me-2" aria-hidden="true" />
          Delete
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
