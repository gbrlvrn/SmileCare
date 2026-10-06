import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Col, Row } from 'react-bootstrap';
import {
  CalendarCheck,
  CalendarEvent,
  CalendarPlus,
  ClockHistory,
  GeoAlt,
  JournalMedical,
  Telephone,
} from 'react-bootstrap-icons';
import { getPatientDashboard } from '../../api/dashboardApi';
import AppointmentCard from '../../components/AppointmentCard';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import CancelAppointmentModal from '../../components/patient/CancelAppointmentModal';
import RescheduleModal from '../../components/patient/RescheduleModal';
import { canPatientChange, dentistLabel, serviceLabel } from '../../components/patient/appointmentRules';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import { CLINIC_HOURS, CLINIC_INFO } from '../../utils/constants';
import { dateParts, formatTime, formatTimeRange } from '../../utils/formatters';
import '../../components/patient/patient.css';

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch(getPatientDashboard, []);

  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const next = data?.nextAppointment || null;
  const counts = data?.counts || { upcoming: 0, completed: 0, cancelled: 0, total: 0 };
  const recent = data?.recentAppointments || [];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'Patient'}!`}
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
          <Button variant="outline-danger" size="sm" onClick={refetch}>
            Try again
          </Button>
        </Alert>
      )}

      {loading && !data ? (
        <Loader className="my-5" label="Loading dashboard..." />
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
                      <div className="sc-welcome-eyebrow">Your next visit</div>
                      <h2 className="sc-welcome-title mb-1">{serviceLabel(next.service)}</h2>
                      <div className="sc-meta-list text-white-50">
                        <span>{formatTimeRange(next.startTime, next.endTime)}</span>
                        <span>&bull;</span>
                        <span>{dentistLabel(next.dentist)}</span>
                        <span>&bull;</span>
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
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="h6 fw-bold mb-0">Recent appointments</h3>
                  <Link to="/patient/appointments" className="small fw-semibold text-decoration-none">
                    View all appointments &rarr;
                  </Link>
                </div>

                {recent.length === 0 ? (
                  <EmptyState
                    icon={CalendarEvent}
                    title="No appointments yet"
                    message="You haven't scheduled any appointments yet."
                    action={
                      <Button as={Link} to="/patient/book" variant="primary" size="sm">
                        Book your first visit
                      </Button>
                    }
                  />
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {recent.slice(0, 4).map((appt) => (
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

            {/* Quick Actions & Clinic Hours */}
            <Col lg={4}>
              <div className="d-flex flex-column gap-4">
                {/* Quick actions card */}
                <div className="sc-card">
                  <h3 className="h6 fw-bold mb-3">Quick actions</h3>
                  <div className="d-flex flex-column gap-2">
                    <Button
                      as={Link}
                      to="/patient/book"
                      variant="outline-primary"
                      className="d-flex align-items-center justify-content-start text-start p-2"
                    >
                      <CalendarPlus className="fs-5 me-2 flex-shrink-0" />
                      <div>
                        <div className="fw-semibold">Book an appointment</div>
                        <div className="small text-muted">Choose your service, dentist & time</div>
                      </div>
                    </Button>
                    <Button
                      as={Link}
                      to="/patient/history"
                      variant="outline-secondary"
                      className="d-flex align-items-center justify-content-start text-start p-2"
                    >
                      <JournalMedical className="fs-5 me-2 flex-shrink-0" />
                      <div>
                        <div className="fw-semibold">Treatment history</div>
                        <div className="small text-muted">View past records & prescriptions</div>
                      </div>
                    </Button>
                  </div>
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
            refetch();
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
            refetch();
          }}
        />
      )}
    </div>
  );
}
