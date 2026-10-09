import { Dropdown } from 'react-bootstrap';
import { ChevronRight, Eye, ThreeDots, Trash } from 'react-bootstrap-icons';
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
    <Dropdown align="end" className="sc-actions-dropdown">
      <Dropdown.Toggle
        variant="light"
        size="sm"
        className="sc-action-trigger sc-icon-toggle"
        disabled={disabled}
        aria-label={`Actions for appointment of ${appointment.patient?.fullName || 'patient'}`}
      >
        <ThreeDots aria-hidden="true" />
      </Dropdown.Toggle>
      {/* fixed strategy: the menu is not clipped by the scrollable table wrapper */}
      <Dropdown.Menu popperConfig={{ strategy: 'fixed' }} className="sc-actions-menu shadow-lg">
        <div className="sc-actions-menu-header">
          <span className="sc-actions-menu-title">Appointment Actions</span>
        </div>

        <Dropdown.Item
          as={Link}
          to={`/staff/appointments/${appointment._id}`}
          className="sc-actions-item sc-actions-item-view"
        >
          <span className="sc-action-icon-pill sc-pill-view">
            <Eye aria-hidden="true" />
          </span>
          <span className="sc-action-text">View details</span>
          <ChevronRight className="sc-action-arrow ms-auto" aria-hidden="true" />
        </Dropdown.Item>

        {statuses.length > 0 && (
          <>
            <div className="sc-actions-divider" />
            <div className="sc-actions-section-label">Update Status</div>
            {statuses.map((status) => {
              const action = STATUS_ACTIONS[status];
              const Icon = action.icon;
              return (
                <Dropdown.Item
                  key={status}
                  as="button"
                  className={`sc-actions-item sc-actions-item-${action.variant}`}
                  onClick={() => onStatusChange(appointment, status)}
                >
                  <span className={`sc-action-icon-pill sc-pill-${action.variant}`}>
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="sc-action-text">{action.label}</span>
                </Dropdown.Item>
              );
            })}
          </>
        )}

        <div className="sc-actions-divider" />
        <Dropdown.Item
          as="button"
          className="sc-actions-item sc-actions-item-danger"
          onClick={() => onDelete(appointment)}
        >
          <span className="sc-action-icon-pill sc-pill-danger">
            <Trash aria-hidden="true" />
          </span>
          <span className="sc-action-text">Delete</span>
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
