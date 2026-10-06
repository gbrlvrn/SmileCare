import { Clock, Person, PersonBadge } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { dateParts, formatDuration, formatTimeRange, fullName } from '../utils/formatters';
import StatusBadge from './StatusBadge';

/**
 * Compact card for one appointment (dashboards, lists, history).
 * @param {object} props
 * @param {object} props.appointment populated appointment from the API
 * @param {React.ReactNode} [props.actions] buttons shown at the bottom right (e.g. View / Cancel)
 * @param {string} [props.to] if set, the service name links to this path (e.g. detail page)
 * @param {boolean} [props.showPatient=false] show the patient name (staff views)
 * @param {React.ReactNode} [props.children] extra content (e.g. treatment summary)
 * @param {string} [props.className]
 */
export default function AppointmentCard({
  appointment,
  actions,
  to,
  showPatient = false,
  children,
  className = '',
}) {
  if (!appointment) return null;
  const { date, startTime, endTime, status, service, dentist, patient } = appointment;
  const parts = dateParts(date);

  return (
    <article className={`sc-card sc-appointment-card ${className}`}>
      <div className="sc-date-tile" aria-hidden="true">
        <span className="sc-date-month">{parts.month}</span>
        <span className="sc-date-day">{parts.day}</span>
        <span className="sc-date-weekday">{parts.weekday}</span>
      </div>

      <div className="flex-grow-1 min-w-0">
        <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <h3 className="h6 fw-semibold mb-1">
            <span className="visually-hidden">{parts.label}: </span>
            {to ? (
              <Link to={to} className="sc-link-plain">
                {service?.name || 'Dental appointment'}
              </Link>
            ) : (
              service?.name || 'Dental appointment'
            )}
          </h3>
          <StatusBadge status={status} />
        </div>

        <ul className="sc-meta-list">
          <li>
            <Clock aria-hidden="true" />
            {formatTimeRange(startTime, endTime)}
            {service?.durationMinutes ? ` · ${formatDuration(service.durationMinutes)}` : ''}
          </li>
          {dentist && (
            <li>
              <PersonBadge aria-hidden="true" />
              {fullName(dentist)}
              {dentist.specialization ? ` · ${dentist.specialization}` : ''}
            </li>
          )}
          {showPatient && patient && (
            <li>
              <Person aria-hidden="true" />
              {fullName(patient)}
            </li>
          )}
        </ul>

        {children}

        {actions && <div className="sc-card-actions">{actions}</div>}
      </div>
    </article>
  );
}
