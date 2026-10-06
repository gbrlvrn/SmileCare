import { APPOINTMENT_STATUSES } from '../utils/constants';

/**
 * Pill badge for an appointment status (soft background + strong text).
 * Can also be used for any label by passing `label` and `variant`
 * (e.g. <StatusBadge label="Active" variant="success" />).
 * @param {object} props
 * @param {'pending'|'confirmed'|'completed'|'cancelled'|'no-show'} [props.status]
 * @param {string} [props.label] overrides the status label
 * @param {'primary'|'success'|'warning'|'danger'|'info'|'secondary'} [props.variant] overrides the colour
 * @param {string} [props.className]
 */
export default function StatusBadge({ status, label, variant, className = '' }) {
  const config = APPOINTMENT_STATUSES[status] || { label: status || 'Unknown', variant: 'secondary' };
  const color = variant || config.variant;
  return (
    <span className={`badge rounded-pill sc-badge sc-badge-${color} ${className}`}>
      <span className="sc-badge-dot" aria-hidden="true" />
      {label || config.label}
    </span>
  );
}
