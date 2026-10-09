import { Clock, Person, PersonBadge } from 'react-bootstrap-icons';
import { Link, useNavigate } from 'react-router-dom';
import { dateParts, formatDuration, formatTimeRange, fullName } from '../utils/formatters';
import { getDentistPortrait } from '../utils/dentistImages';
import { servicesLabel } from './patient/appointmentRules';
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
  showDentistPortrait = false,
  children,
  className = '',
}) {
  const navigate = useNavigate();

  if (!appointment) return null;
  const { date, startTime, endTime, status, service, services, dentist, patient } = appointment;
  const parts = dateParts(date);
  const titleText = servicesLabel(appointment) || 'Dental appointment';
  const totalDuration = services?.length
    ? services.reduce((acc, s) => acc + (s.durationMinutes || 0), 0)
    : (service?.durationMinutes || 0);

  const handleCardClick = (e) => {
    if (!to) return;
    if (e.target.closest('button, a, input, select, textarea, [role="button"], .sc-card-actions')) {
      return;
    }
    navigate(to);
  };

  const handleKeyDown = (e) => {
    if (!to) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.closest('button, a, input, select, textarea, [role="button"], .sc-card-actions')) {
        return;
      }
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <article
      className={`sc-card sc-appointment-card ${to ? 'is-clickable' : ''} ${className}`}
      onClick={to ? handleCardClick : undefined}
      onKeyDown={to ? handleKeyDown : undefined}
      tabIndex={to ? 0 : undefined}
      role={to ? 'link' : undefined}
      aria-label={to ? `View appointment details for ${titleText}` : undefined}
    >
      <div className="sc-date-tile" aria-hidden="true">
        <span className="sc-date-month">{parts.month}</span>
        <span className="sc-date-day">{parts.day}</span>
        <span className="sc-date-weekday">{parts.weekday}</span>
      </div>

      <div className="flex-grow-1 min-w-0">
        <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <h3 className="h6 fw-semibold mb-1 d-flex align-items-center flex-wrap">
            <span className="visually-hidden">{parts.label}: </span>
            {to ? (
              <Link to={to} className="sc-link-plain">
                {titleText}
              </Link>
            ) : (
              titleText
            )}
            {services?.length > 1 && (
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle ms-2" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                {services.length} services
              </span>
            )}
          </h3>
          <StatusBadge status={status} />
        </div>

        <ul className="sc-meta-list">
          <li>
            <Clock aria-hidden="true" />
            {formatTimeRange(startTime, endTime)}
            {totalDuration ? ` · ${formatDuration(totalDuration)}` : ''}
          </li>
          {dentist && (
            showDentistPortrait ? (
              <li className="d-inline-flex align-items-center gap-2">
                <img
                  src={getDentistPortrait(dentist)}
                  alt={fullName(dentist)}
                  className="rounded-circle object-fit-cover shadow-xs border"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderColor: 'rgba(30, 111, 232, 0.3)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    flexShrink: 0,
                  }}
                />
                <span>
                  <strong className="text-dark">{fullName(dentist)}</strong>
                  {dentist.specialization ? ` · ${dentist.specialization}` : ''}
                </span>
              </li>
            ) : (
              <li>
                <PersonBadge aria-hidden="true" />
                {fullName(dentist)}
                {dentist.specialization ? ` · ${dentist.specialization}` : ''}
              </li>
            )
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
