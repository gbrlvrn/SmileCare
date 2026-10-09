import { isValidElement } from 'react';
import { Link } from 'react-router-dom';

/**
 * Small metric card for dashboards.
 * When `to` or `onClick` is provided, the card becomes an interactive link/button.
 *
 * @param {object} props
 * @param {React.ElementType|React.ReactNode} props.icon react-bootstrap-icons component, e.g. CalendarCheck
 * @param {string} props.label e.g. 'Upcoming'
 * @param {React.ReactNode} props.value e.g. 3
 * @param {'primary'|'success'|'warning'|'danger'|'info'|'secondary'} [props.variant='primary'] icon colour
 * @param {React.ReactNode} [props.hint] small helper text under the value
 * @param {string} [props.to] optional navigation destination
 * @param {() => void} [props.onClick] optional click handler
 * @param {string} [props.className]
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  variant = 'primary',
  hint,
  to,
  onClick,
  className = '',
}) {
  const isClickable = Boolean(to || onClick);
  const Component = to ? Link : isClickable ? 'button' : 'div';
  const componentProps = to
    ? {
        to,
        className: `sc-card sc-stat-card sc-stat-card-${variant} is-clickable h-100 ${className}`.trim(),
        title: `View ${label}`,
      }
    : isClickable
      ? {
          type: 'button',
          onClick,
          className: `sc-card sc-stat-card sc-stat-card-${variant} is-clickable h-100 text-start w-100 p-0 border-0 bg-transparent ${className}`.trim(),
          title: `View ${label}`,
        }
      : {
          className: `sc-card sc-stat-card sc-stat-card-${variant} h-100 ${className}`.trim(),
        };

  return (
    <Component {...componentProps}>
      {Icon && (
        <div className={`sc-stat-icon sc-tint-${variant}`} aria-hidden="true">
          {isValidElement(Icon) ? Icon : <Icon size={22} />}
        </div>
      )}
      <div className="min-w-0">
        <div className="sc-stat-label">{label}</div>
        <div className="sc-stat-value">{value ?? '—'}</div>
        {hint && <div className="sc-stat-hint">{hint}</div>}
      </div>
    </Component>
  );
}
