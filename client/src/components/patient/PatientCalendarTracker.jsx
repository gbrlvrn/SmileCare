import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import {
  CalendarCheck,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  PersonBadge,
} from 'react-bootstrap-icons';
import StatusBadge from '../StatusBadge';
import { canPatientChange, dentistLabel, serviceLabel } from './appointmentRules';
import { formatDate, formatTimeRange, toInputDate, todayISO } from '../../utils/formatters';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDayStatus(dayAppts) {
  if (!dayAppts || dayAppts.length === 0) return null;
  // Priority: confirmed > pending > completed > cancelled
  if (dayAppts.some((a) => a.status === 'confirmed')) return 'confirmed';
  if (dayAppts.some((a) => a.status === 'pending')) return 'pending';
  if (dayAppts.some((a) => a.status === 'completed')) return 'completed';
  if (dayAppts.some((a) => a.status === 'cancelled')) return 'cancelled';
  return dayAppts[0]?.status || null;
}

/**
 * Interactive visual appointment calendar tracker for the patient dashboard.
 * - Displays a responsive monthly calendar grid
 * - Dots indicate appointment dates colored by status (Confirmed = green, Pending = amber, etc.)
 * - Selecting a date reveals scheduled visits or quick booking for that date
 *
 * @param {object} props
 * @param {object[]} [props.appointments=[]] list of patient appointments
 * @param {object} [props.nextAppointment] the upcoming appointment (if any)
 * @param {(appt: object) => void} [props.onReschedule] callback to open reschedule modal
 */
export default function PatientCalendarTracker({
  appointments = [],
  nextAppointment = null,
  onReschedule,
}) {
  const [todayStr] = useState(todayISO);

  // Default active month and selected date to next appointment date or today
  const nextDate = nextAppointment?.date ? toInputDate(nextAppointment.date) : null;
  const initialDateStr = nextDate && nextDate >= todayISO() ? nextDate : todayISO();
  const [selectedDate, setSelectedDate] = useState(initialDateStr);

  const [currentYear, setCurrentYear] = useState(() => {
    if (initialDateStr) {
      const [y] = initialDateStr.split('-').map(Number);
      return y;
    }
    return new Date().getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (initialDateStr) {
      const [, m] = initialDateStr.split('-').map(Number);
      return m - 1; // 0-indexed
    }
    return new Date().getMonth();
  });

  // Map appointments by YYYY-MM-DD for O(1) lookup
  const appointmentsByDate = useMemo(() => {
    const map = new Map();
    appointments.forEach((appt) => {
      const d = toInputDate(appt.date);
      if (!d) return;
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(appt);
    });
    return map;
  }, [appointments]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = todayISO();
    const [y, m] = today.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);
    setSelectedDate(today);
  };

  // Build grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        dateStr,
        isCurrentMonth: false,
        appointments: appointmentsByDate.get(dateStr) || [],
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        dateStr,
        isCurrentMonth: true,
        appointments: appointmentsByDate.get(dateStr) || [],
      });
    }

    // Trailing days from next month to complete the row
    const totalCells = days.length <= 35 ? 35 : 42;
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        dateStr,
        isCurrentMonth: false,
        appointments: appointmentsByDate.get(dateStr) || [],
      });
    }

    return days;
  }, [currentYear, currentMonth, appointmentsByDate]);

  // Selected date appointments
  const selectedAppointments = useMemo(() => {
    return appointmentsByDate.get(selectedDate) || [];
  }, [appointmentsByDate, selectedDate]);

  const monthLabel = useMemo(() => {
    const d = new Date(Date.UTC(currentYear, currentMonth, 1));
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }, [currentYear, currentMonth]);

  return (
    <div className="sc-card sc-tracker-card">
      {/* Tracker Header */}
      <div className="sc-tracker-header">
        <h3 className="sc-tracker-title">
          <CalendarCheck className="text-primary" size={18} aria-hidden="true" />
          <span>Appointment Tracker</span>
        </h3>
        <button
          type="button"
          className="sc-tracker-today-btn"
          onClick={handleJumpToToday}
          title="Jump to today"
        >
          Today
        </button>
      </div>

      {/* Month Navigation */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span className="sc-tracker-month-label">{monthLabel}</span>
        <div className="sc-tracker-month-nav">
          <button
            type="button"
            className="sc-tracker-nav-btn"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeft size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="sc-tracker-nav-btn"
            onClick={handleNextMonth}
            aria-label="Next month"
            title="Next month"
          >
            <ChevronRight size={13} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="sc-tracker-grid" role="grid" aria-label="Month calendar">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="sc-tracker-weekday" aria-hidden="true">
            {wd}
          </div>
        ))}

        {calendarDays.map(({ day, dateStr, isCurrentMonth, appointments: dayAppts }) => {
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;
          const dayStatus = getDayStatus(dayAppts);
          const statusClass = dayStatus ? `has-status-${dayStatus}` : '';

          return (
            <button
              key={dateStr}
              type="button"
              className={`sc-tracker-day${!isCurrentMonth ? ' is-outside' : ''}${isPast ? ' is-past' : ''}${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''} ${statusClass}`.trim()}
              onClick={() => setSelectedDate(dateStr)}
              aria-label={`${formatDate(dateStr)}${isToday ? ', Today' : ''}${isPast ? ', Past date' : ''}${dayStatus ? `, ${dayStatus} appointment` : ''}`}
              aria-pressed={isSelected}
            >
              <span>{day}</span>
            </button>
          );
        })}
      </div>

      {/* Status Legend */}
      <div className="sc-tracker-legend" aria-hidden="true">
        <span className="sc-tracker-legend-item">
          <span className="sc-tracker-swatch sc-tracker-swatch--today" />
          <span>Today</span>
        </span>
        <span className="sc-tracker-legend-item">
          <span className="sc-tracker-swatch sc-tracker-swatch--confirmed" />
          <span>Confirmed</span>
        </span>
        <span className="sc-tracker-legend-item">
          <span className="sc-tracker-swatch sc-tracker-swatch--pending" />
          <span>Pending</span>
        </span>
        <span className="sc-tracker-legend-item">
          <span className="sc-tracker-swatch sc-tracker-swatch--completed" />
          <span>Completed</span>
        </span>
      </div>

      {/* Selected Day Agenda Box */}
      <div className="sc-tracker-agenda">
        <div className="sc-tracker-agenda-header">
          <div className="d-flex align-items-center gap-2">
            <span className="sc-tracker-agenda-date">{formatDate(selectedDate, { weekday: 'short' })}</span>
            {selectedDate === todayStr && (
              <span className="sc-tracker-today-pill">Today</span>
            )}
            {selectedDate < todayStr && (
              <span className="sc-tracker-past-pill">Past date</span>
            )}
          </div>
          {selectedAppointments.length > 0 && (
            <span className="sc-tracker-agenda-count">
              {selectedAppointments.length} {selectedAppointments.length === 1 ? 'visit' : 'visits'}
            </span>
          )}
        </div>

        {selectedAppointments.length === 0 ? (
          selectedDate < todayStr ? (
            <div className="sc-tracker-empty is-past">
              <div className="sc-tracker-empty-title">Date has passed</div>
              <p className="small text-muted mb-0">
                This date has already passed. Appointments cannot be scheduled for past dates.
              </p>
            </div>
          ) : (
            <div className="sc-tracker-empty">
              <p className="small text-muted mb-2">No visits scheduled for this date.</p>
              <Button
                as={Link}
                to={`/patient/book?date=${selectedDate}`}
                variant="outline-primary"
                size="sm"
                className="d-inline-flex align-items-center gap-1"
              >
                <CalendarPlus size={14} aria-hidden="true" />
                <span>Book for this date</span>
              </Button>
            </div>
          )
        ) : (
          <div className="d-flex flex-column gap-2">
            {selectedAppointments.map((appt) => (
              <div
                key={appt._id}
                className={`sc-tracker-item is-${appt.status}`}
              >
                <div className="d-flex justify-content-between align-items-start gap-1">
                  <span className="fw-semibold text-body small">
                    {serviceLabel(appt.service)}
                  </span>
                  <StatusBadge status={appt.status} />
                </div>

                <div className="small text-muted d-flex align-items-center gap-1">
                  <Clock size={13} className="text-primary flex-shrink-0" aria-hidden="true" />
                  <span>{formatTimeRange(appt.startTime, appt.endTime)}</span>
                </div>

                {appt.dentist && (
                  <div className="small text-muted d-flex align-items-center gap-1">
                    <PersonBadge size={13} className="text-secondary flex-shrink-0" aria-hidden="true" />
                    <span>{dentistLabel(appt.dentist)}</span>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center pt-1 border-top mt-1">
                  <Link
                    to={`/patient/appointments/${appt._id}`}
                    className="small fw-semibold text-primary text-decoration-none"
                  >
                    View details &rarr;
                  </Link>
                  {canPatientChange(appt) && onReschedule && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-secondary p-0 text-decoration-none small"
                      onClick={() => onReschedule(appt)}
                    >
                      Reschedule
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
