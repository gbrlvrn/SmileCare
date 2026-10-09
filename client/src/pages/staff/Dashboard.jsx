import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Col, ProgressBar, Row, Table } from 'react-bootstrap';
import {
  Calendar2Check,
  CalendarDay,
  CalendarPlus,
  HourglassSplit,
  People,
  PersonBadge,
  Scissors,
} from 'react-bootstrap-icons';
import { getStaffDashboard } from '../../api/dashboardApi';
import EmptyState from '../../components/EmptyState';
import StaffDashboardSkeleton from '../../components/skeletons/StaffDashboardSkeleton';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import StaffStatusPie from '../../components/staff/StaffStatusPie';
import StaffTrendChart from '../../components/staff/StaffTrendChart';
import StatusActionButtons from '../../components/staff/StatusActionButtons';
import StatusChangeModal from '../../components/staff/StatusChangeModal';
import useAppointmentActions from '../../components/staff/useAppointmentActions';
import useFetch from '../../hooks/useFetch';
import {
  formatTime,
  fullName,
  initials,
  todayISO,
} from '../../utils/formatters';

export default function StaffDashboard() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { data, loading, error, refetch } = useFetch(getStaffDashboard, []);

  const { changeStatus, busyId, modalProps } = useAppointmentActions({
    onChanged: refetch,
  });

  const totals = data?.totals || { patients: 0, dentists: 0, services: 0, appointmentsToday: 0, pending: 0 };
  const statusCounts = data?.statusCounts || {};
  const todaySchedule = data?.todaySchedule || [];
  const trend = data?.trend || [];
  const topServices = data?.topServices || [];

  const maxServiceCount = Math.max(...topServices.map((s) => s.count), 1);

  return (
    <div>
      <PageHeader
        title="Clinic dashboard"
        subtitle="Live clinic overview, patient appointments, and daily operational metrics."
        actions={
          <Button variant="primary" onClick={() => setShowBookingModal(true)}>
            <CalendarPlus className="me-2" />
            New appointment
          </Button>
        }
      />

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={refetch}>
            Try again
          </Button>
        </div>
      )}

      {loading && !data ? (
        <StaffDashboardSkeleton />
      ) : (
        <>
          {/* Top Metric Cards */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={4} lg>
              <StatCard
                icon={CalendarDay}
                label="Appointments today"
                value={totals.appointmentsToday}
                variant="primary"
                hint="Scheduled for today"
                to={`/staff/appointments?from=${todayISO()}&to=${todayISO()}`}
              />
            </Col>
            <Col xs={6} md={4} lg>
              <StatCard
                icon={HourglassSplit}
                label="Pending approval"
                value={totals.pending}
                variant="warning"
                hint="Needs staff confirmation"
                to="/staff/appointments?status=pending"
              />
            </Col>
            <Col xs={6} md={4} lg>
              <StatCard
                icon={People}
                label="Registered patients"
                value={totals.patients}
                variant="info"
                hint="All-time patient records"
                to="/staff/patients"
              />
            </Col>
            <Col xs={6} md={4} lg>
              <StatCard
                icon={PersonBadge}
                label="Active dentists"
                value={totals.dentists}
                variant="success"
                hint="On active duty"
                to="/staff/dentists"
              />
            </Col>
            <Col xs={6} md={4} lg>
              <StatCard
                icon={Scissors}
                label="Dental services"
                value={totals.services}
                variant="secondary"
                hint="Available treatments"
                to="/staff/services"
              />
            </Col>
          </Row>

          {/* Charts Row */}
          <Row className="g-4 mb-4">
            <Col lg={8}>
              <div className="sc-card h-100 p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h3 className="h6 fw-bold mb-0">14-Day Appointment Volume</h3>
                    <div className="small text-muted">Daily appointment counts over the last two weeks</div>
                  </div>
                </div>
                <StaffTrendChart trend={trend} />
              </div>
            </Col>

            <Col lg={4}>
              <div className="sc-card h-100 p-4">
                <h3 className="h6 fw-bold mb-1">Status distribution</h3>
                <div className="small text-muted mb-3">Breakdown by appointment state</div>
                <StaffStatusPie statusCounts={statusCounts} />
              </div>
            </Col>
          </Row>

          {/* Today's Schedule & Top Services Row */}
          <Row className="g-4 mb-4">
            <Col xs={12} xl={8}>
              <div className="sc-card sc-table-card h-100">
                <div className="p-3 p-md-4 border-bottom d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="h6 fw-bold mb-0">Today&apos;s clinic schedule</h3>
                    <div className="small text-muted">
                      {todaySchedule.length} appointments scheduled for today
                    </div>
                  </div>
                  <Link to="/staff/appointments" className="small fw-semibold text-decoration-none">
                    All appointments &rarr;
                  </Link>
                </div>

                {todaySchedule.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      icon={Calendar2Check}
                      title="No appointments scheduled today"
                      message="There are currently no visits on the books for today."
                      action={
                        <Button variant="primary" size="sm" onClick={() => setShowBookingModal(true)}>
                          Book walk-in appointment
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover align="middle" className="sc-table sc-schedule-table mb-0">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Patient</th>
                          <th>Dentist</th>
                          <th>Service</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todaySchedule.map((appt) => (
                          <tr key={appt._id}>
                            <td className="fw-semibold text-primary font-monospace text-nowrap" style={{ fontSize: '0.8rem' }}>
                              {formatTime(appt.startTime)}
                            </td>
                            <td className="text-nowrap">
                              <div className="d-flex align-items-center gap-2">
                                <span className="sc-avatar flex-shrink-0" aria-hidden="true">
                                  {initials(fullName(appt.patient))}
                                </span>
                                <div className="min-w-0" style={{ lineHeight: 1.25 }}>
                                  <Link
                                    to={`/staff/patients/${appt.patient?._id}`}
                                    className="fw-semibold text-body text-decoration-none text-nowrap d-block"
                                    style={{ fontSize: '0.84rem' }}
                                  >
                                    {fullName(appt.patient)}
                                  </Link>
                                  <div className="text-muted text-nowrap" style={{ fontSize: '0.72rem' }}>{appt.patient?.phone}</div>
                                </div>
                              </div>
                            </td>
                            <td className="text-muted text-nowrap" style={{ fontSize: '0.8125rem' }}>{fullName(appt.dentist)}</td>
                            <td className="text-nowrap" style={{ fontSize: '0.8125rem' }}>
                              {appt.services && appt.services.length > 1 ? (
                                <div>
                                  <div
                                    className="fw-semibold text-truncate text-nowrap"
                                    style={{ maxWidth: '160px' }}
                                    title={appt.services.map((s) => s.name).join(', ')}
                                  >
                                    {appt.services.map((s) => s.name).join(', ')}
                                  </div>
                                  <span
                                    className="badge bg-primary-subtle text-primary border border-primary-subtle text-nowrap"
                                    style={{ fontSize: '0.65rem' }}
                                  >
                                    {appt.services.length} services
                                  </span>
                                </div>
                              ) : (
                                <span className="fw-semibold text-nowrap">{appt.service?.name}</span>
                              )}
                            </td>
                            <td className="text-nowrap">
                              <StatusBadge status={appt.status} />
                            </td>
                            <td className="text-end text-nowrap">
                              <StatusActionButtons
                                appointment={appt}
                                onChange={changeStatus}
                                busy={busyId === appt._id}
                                only={['confirmed', 'completed']}
                                size="sm"
                                shortLabels={true}
                                className="justify-content-end"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </Col>

            {/* Top Services */}
            <Col xs={12} xl={4}>
              <div className="sc-card h-100 p-4">
                <h3 className="h6 fw-bold mb-1">Most popular services</h3>
                <div className="small text-muted mb-4">Top requested dental treatments</div>

                {topServices.length === 0 ? (
                  <div className="small text-muted text-center py-4">No completed services yet.</div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {topServices.map((svc) => (
                      <div key={svc.serviceId || svc.name}>
                        <div className="d-flex justify-content-between align-items-center small mb-1">
                          <span className="fw-semibold text-body">{svc.name}</span>
                          <span className="text-muted font-monospace">{svc.count} visits</span>
                        </div>
                        <ProgressBar
                          now={(svc.count / maxServiceCount) * 100}
                          variant="primary"
                          style={{ height: 6 }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <AppointmentFormModal
          show={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSaved={() => {
            setShowBookingModal(false);
            refetch();
          }}
        />
      )}

      {/* Status Change Confirmation Modal */}
      <StatusChangeModal {...modalProps} />
    </div>
  );
}
