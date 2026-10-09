import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Col, Row } from 'react-bootstrap';
import {
  CalendarCheck,
  CalendarEvent,
  CalendarPlus,
  ClockHistory,
  GeoAlt,
  JournalMedical,
  LightbulbFill,
  Telephone,
} from 'react-bootstrap-icons';
import { getAppointments } from '../../api/appointmentApi';
import { getPatientDashboard } from '../../api/dashboardApi';
import AppointmentCard from '../../components/AppointmentCard';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import CancelAppointmentModal from '../../components/patient/CancelAppointmentModal';
import PatientCalendarTracker from '../../components/patient/PatientCalendarTracker';
import RescheduleModal from '../../components/patient/RescheduleModal';
import { canPatientChange, dentistLabel, serviceLabel, servicesLabel } from '../../components/patient/appointmentRules';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import { CLINIC_HOURS, CLINIC_INFO } from '../../utils/constants';
import { dateParts, formatTime, formatTimeRange } from '../../utils/formatters';
import PatientDashboardSkeleton from './PatientDashboardSkeleton';
import '../../components/patient/patient.css';

/**
 * Returns a warm, time-appropriate greeting.
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Returns a friendly relative countdown label for an upcoming visit.
 */
function getCountdownBadge(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return { label: 'Today', bg: 'bg-warning text-dark' };
  if (diffDays === 1) return { label: 'Tomorrow', bg: 'bg-warning text-dark' };
  if (diffDays > 1 && diffDays <= 7) return { label: `In ${diffDays} days`, bg: 'bg-warning text-dark' };
  if (diffDays > 7 && diffDays <= 30) return { label: `In ${diffDays} days`, bg: 'bg-warning text-dark' };
  return { label: 'Upcoming', bg: 'bg-warning text-dark' };
}

const DENTAL_TIPS = [
  'Remember to brush for a full 2 minutes twice a day with fluoride toothpaste.',
  'Flossing once daily cleans the 40% of tooth surfaces that brushing misses.',
  'Replace your toothbrush every 3 months or sooner if bristles become frayed.',
  'Rinse your mouth with water after drinking coffee or tea to reduce staining.',
  'Routine dental cleanings every 6 months prevent plaque from hardening into tartar.',
  'Drink water after meals to help wash away food particles and protect your enamel.',
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch(getPatientDashboard, []);

  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [recentFilter, setRecentFilter] = useState('all'); // 'all' | 'upcoming' | 'completed' | 'cancelled'
  const [appointmentsList, setAppointmentsList] = useState([]);

  const fetchCalendarAppointments = useCallback(() => {
    getAppointments({ limit: 100 })
      .then((res) => {
        setAppointmentsList(res?.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCalendarAppointments();
  }, [fetchCalendarAppointments]);

  const handleRefetch = useCallback(() => {
    refetch();
    fetchCalendarAppointments();
  }, [refetch, fetchCalendarAppointments]);

  const next = data?.nextAppointment || null;
  const counts = data?.counts || { upcoming: 0, completed: 0, cancelled: 0, total: 0 };
  const recent = data?.recentAppointments || [];

  const calendarAppointments = useMemo(() => {
    if (appointmentsList.length > 0) return appointmentsList;
    const combined = [...(data?.recentAppointments || [])];
    if (next && !combined.some((a) => a._id === next._id)) {
      combined.push(next);
    }
    return combined;
  }, [appointmentsList, data?.recentAppointments, next]);

  const [greeting] = useState(getGreeting);
  const [tip] = useState(() => DENTAL_TIPS[new Date().getDate() % DENTAL_TIPS.length]);
  const countdown = next ? getCountdownBadge(next.date) : null;

  const filteredRecent = recent.filter((appt) => {
    if (recentFilter === 'all') return true;
    if (recentFilter === 'upcoming') {
      return ['pending', 'confirmed'].includes(appt.status);
    }
    if (recentFilter === 'completed') {
      return appt.status === 'completed';
    }
    if (recentFilter === 'cancelled') {
      return appt.status === 'cancelled';
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${user?.firstName || 'Patient'}!`}
        subtitle="Manage your dental appointments, view upcoming visits, and track treatment history."
        actions={
          <Button as={Link} to="/patient/book" variant="primary">
            <CalendarPlus className="me-2" />
            Book appointment
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" className="d-flex align-items-center justify-content-between">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={handleRefetch}>
            Try again
          </Button>
        </Alert>
      )}

      {loading && !data ? (
        <PatientDashboardSkeleton />
      ) : (
        <>
          {/* Next Appointment Banner */}
          <div className="mb-4">
            {next ? (
              <div className="sc-welcome-banner">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                  <div className="d-flex align-items-center gap-3">
                    {(() => {
                      const parts = dateParts(next.date);
                      return (
                        <div className="sc-welcome-date" aria-label={parts.label}>
                          <span className="sc-date-month">{parts.month}</span>
                          <strong className="sc-date-day">{parts.day}</strong>
                          <span className="sc-date-weekday">{parts.weekday}</span>
                        </div>
                      );
                    })()}
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className="sc-welcome-eyebrow mb-0">Your next visit</span>
                        {countdown && (
                          <span className={`badge ${countdown.bg} fw-bold sc-countdown-badge`}>
                            {countdown.label}
                          </span>
                        )}
                      </div>
                      <h2 className="sc-welcome-title mb-1 d-flex align-items-center flex-wrap">
                        {servicesLabel(next)}
                        {next.services && next.services.length > 1 && (
                          <span
                            className="badge bg-warning text-dark border border-warning ms-2"
                            style={{ fontSize: '0.72rem', verticalAlign: 'middle' }}
                          >
                            {next.services.length} services
                          </span>
                        )}
                      </h2>
                      <div className="sc-meta-list text-white">
                        <span className="fw-medium text-white">{formatTimeRange(next.startTime, next.endTime)}</span>
                        <span className="opacity-50" aria-hidden="true">&bull;</span>
                        <span className="fw-medium text-white">{dentistLabel(next.dentist)}</span>
                        <span className="opacity-50" aria-hidden="true">&bull;</span>
                        <StatusBadge status={next.status} />
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-2 mt-md-0">
                    <Button
                      as={Link}
                      to={`/patient/appointments/${next._id}`}
                      variant="light"
                      className="text-primary fw-semibold"
                    >
                      View details
                    </Button>
                    {canPatientChange(next) && (
                      <Button
                        variant="outline-light"
                        onClick={() => setRescheduleTarget(next)}
                      >
                        Reschedule
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="sc-card p-4 text-center">
                <div className="py-2">
                  <CalendarEvent size={40} className="text-primary mb-3" />
                  <h3 className="h5 fw-bold mb-1">No upcoming appointments</h3>
                  <p className="text-muted mb-3">
                    Stay on top of your dental health. Schedule your next routine check-up or cleaning today!
                  </p>
                  <Button as={Link} to="/patient/book" variant="primary">
                    <CalendarPlus className="me-2" />
                    Book an appointment now
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Stat Cards */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <StatCard
                icon={CalendarCheck}
                label="Upcoming"
                value={counts.upcoming}
                variant="primary"
                hint="Scheduled visits"
              />
            </Col>
            <Col xs={6} md={3}>
              <StatCard
                icon={JournalMedical}
                label="Completed"
                value={counts.completed}
                variant="success"
                hint="Past visits"
              />
            </Col>
            <Col xs={6} md={3}>
              <StatCard
                icon={ClockHistory}
                label="Cancelled"
                value={counts.cancelled}
                variant="danger"
                hint="Cancelled visits"
              />
            </Col>
            <Col xs={6} md={3}>
              <StatCard
                icon={CalendarEvent}
                label="Total visits"
                value={counts.total}
                variant="info"
                hint="All-time appointments"
              />
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            {/* Recent Appointments */}
            <Col lg={8}>
              <div className="sc-card h-100">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <h3 className="h6 fw-bold mb-0">Recent appointments</h3>
                    {recent.length > 0 && (
                      <div className="btn-group btn-group-sm sc-dashboard-filter ms-2" role="group" aria-label="Filter recent appointments">
                        <button
                          type="button"
                          className={`btn ${recentFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setRecentFilter('all')}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          className={`btn ${recentFilter === 'upcoming' ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setRecentFilter('upcoming')}
                        >
                          Upcoming
                        </button>
                        <button
                          type="button"
                          className={`btn ${recentFilter === 'completed' ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setRecentFilter('completed')}
                        >
                          Completed
                        </button>
                        <button
                          type="button"
                          className={`btn ${recentFilter === 'cancelled' ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setRecentFilter('cancelled')}
                        >
                          Cancelled
                        </button>
                      </div>
                    )}
                  </div>
                  <Link to="/patient/appointments" className="small fw-semibold text-decoration-none">
                    View all appointments &rarr;
                  </Link>
                </div>

                {filteredRecent.length === 0 ? (
                  <EmptyState
                    icon={CalendarEvent}
                    title={recent.length === 0 ? 'No appointments yet' : 'No matching appointments'}
                    message={
                      recent.length === 0
                        ? "You haven't scheduled any appointments yet."
                        : `No ${recentFilter} appointments found in your recent history.`
                    }
                    action={
                      recent.length === 0 ? (
                        <Button as={Link} to="/patient/book" variant="primary" size="sm">
                          Book your first visit
                        </Button>
                      ) : null
                    }
                  />
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {filteredRecent.slice(0, 4).map((appt) => (
                      <AppointmentCard
                        key={appt._id}
                        appointment={appt}
                        to={`/patient/appointments/${appt._id}`}
                        actions={
                          canPatientChange(appt) && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCancelTarget(appt);
                              }}
                            >
                              Cancel
                            </Button>
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </Col>

            {/* Calendar Tracker, Daily Tip & Clinic Hours */}
            <Col lg={4}>
              <div className="d-flex flex-column gap-4">
                {/* Visual Appointment Calendar Tracker */}
                <PatientCalendarTracker
                  appointments={calendarAppointments}
                  nextAppointment={next}
                  onReschedule={setRescheduleTarget}
                />

                {/* Daily Dental Tip Widget */}
                <div className="sc-tip-card">
                  <div className="d-flex align-items-center gap-2 mb-2 text-warning-emphasis fw-bold small">
                    <LightbulbFill className="text-warning" size={16} aria-hidden="true" />
                    <span>Daily Oral Health Tip</span>
                  </div>
                  <p className="small text-muted mb-0 lh-sm">
                    {tip}
                  </p>
                </div>

                {/* Clinic Info card */}
                <div className="sc-card">
                  <h3 className="h6 fw-bold mb-3">Clinic details</h3>
                  <div className="small text-muted d-flex flex-column gap-2">
                    <div className="d-flex align-items-start gap-2">
                      <ClockHistory className="text-primary mt-1 flex-shrink-0" />
                      <div>
                        <strong className="text-body d-block">{CLINIC_HOURS.days}</strong>
                        {formatTime(CLINIC_HOURS.open)} – {formatTime(CLINIC_HOURS.close)}
                      </div>
                    </div>
                    <div className="d-flex align-items-start gap-2">
                      <Telephone className="text-primary mt-1 flex-shrink-0" />
                      <div>
                        <strong className="text-body d-block">Contact</strong>
                        {CLINIC_INFO.phone}
                      </div>
                    </div>
                    <div className="d-flex align-items-start gap-2">
                      <GeoAlt className="text-primary mt-1 flex-shrink-0" />
                      <div>
                        <strong className="text-body d-block">Location</strong>
                        {CLINIC_INFO.address}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={() => {
            setRescheduleTarget(null);
            handleRefetch();
          }}
        />
      )}

      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelAppointmentModal
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={() => {
            setCancelTarget(null);
            handleRefetch();
          }}
        />
      )}
    </div>
  );
}
