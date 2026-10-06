import { isValidElement } from 'react';

/**
 * Small metric card for dashboards.
 * @param {object} props
 * @param {React.ElementType|React.ReactNode} props.icon react-bootstrap-icons component, e.g. CalendarCheck
 * @param {string} props.label e.g. 'Upcoming'
 * @param {React.ReactNode} props.value e.g. 3
 * @param {'primary'|'success'|'warning'|'danger'|'info'|'secondary'} [props.variant='primary'] icon colour
 * @param {React.ReactNode} [props.hint] small helper text under the value
 */
export default function StatCard({ icon: Icon, label, value, variant = 'primary', hint }) {
  return (
    <div className="sc-card sc-stat-card h-100">
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
    </div>
  );
}
