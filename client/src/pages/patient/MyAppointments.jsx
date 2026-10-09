import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, ButtonGroup, Col, Form, Row } from 'react-bootstrap';
import { CalendarCheck, CalendarPlus } from 'react-bootstrap-icons';
import { getAppointments } from '../../api/appointmentApi';
import AppointmentCard from '../../components/AppointmentCard';
import EmptyState from '../../components/EmptyState';
import AppointmentListSkeleton from '../../components/skeletons/AppointmentListSkeleton';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import SearchBar from '../../components/SearchBar';
import CancelAppointmentModal from '../../components/patient/CancelAppointmentModal';
import RescheduleModal from '../../components/patient/RescheduleModal';
import { canPatientChange } from '../../components/patient/appointmentRules';
import useListQuery from '../../hooks/useListQuery';
import { STATUS_OPTIONS } from '../../utils/constants';
import '../../components/patient/patient.css';

export default function MyAppointments() {
  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'past' | 'cancelled' | 'all'
  const [cancelTarget, setCancelTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  const {
    items: appointments,
    pagination,
    loading,
    error,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    refetch,
  } = useListQuery(getAppointments, {
    initialFilters: { upcoming: 'true' },
    limit: 8,
  });

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    if (nextTab === 'upcoming') {
      setFilter('upcoming', 'true');
      setFilter('status', undefined);
    } else if (nextTab === 'past') {
      setFilter('upcoming', 'false');
      setFilter('status', undefined);
    } else if (nextTab === 'cancelled') {
      setFilter('upcoming', undefined);
      setFilter('status', 'cancelled');
    } else {
      setFilter('upcoming', undefined);
      setFilter('status', undefined);
    }
  };

  return (
    <div>
      <PageHeader
        title="My appointments"
        subtitle="View, track, reschedule, or cancel your scheduled dental visits."
        actions={
          <Button as={Link} to="/patient/book" variant="primary">
            <CalendarPlus className="me-2" />
            Book appointment
          </Button>
        }
      />

      {/* Toolbar: Search, Status filter, Tabs */}
      <div className="sc-card mb-4 p-3">
        <Row className="g-3 align-items-center">
          <Col lg={4} md={12}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by dentist or service..."
            />
          </Col>

          <Col sm={5} lg={3} md={4}>
            <Form.Select
              value={filters.status || ''}
              onChange={(e) => {
                const val = e.target.value || undefined;
                setFilter('status', val);
                if (val === 'cancelled') {
                  setTab('cancelled');
                } else if (tab === 'cancelled' && val !== 'cancelled') {
                  setTab('all');
                }
              }}
              aria-label="Filter by appointment status"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col sm={7} lg={5} md={8} className="d-flex justify-content-sm-end">
            <ButtonGroup aria-label="Appointment view filter" className="flex-wrap">
              <Button
                variant={tab === 'upcoming' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => handleTabChange('upcoming')}
              >
                Upcoming
              </Button>
              <Button
                variant={tab === 'past' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => handleTabChange('past')}
              >
                Past
              </Button>
              <Button
                variant={tab === 'cancelled' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => handleTabChange('cancelled')}
              >
                Cancelled
              </Button>
              <Button
                variant={tab === 'all' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => handleTabChange('all')}
              >
                All
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
      </div>

      {/* Content */}
      {loading && appointments.length === 0 ? (
        <AppointmentListSkeleton count={4} />
      ) : error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={refetch}>
            Try again
          </Button>
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={
            search
              ? 'No appointments found'
              : tab === 'upcoming'
              ? 'No upcoming appointments'
              : tab === 'past'
              ? 'No past appointments'
              : tab === 'cancelled'
              ? 'No cancelled appointments'
              : filters.status
              ? `No ${filters.status} appointments`
              : 'No appointments recorded'
          }
          message={
            search || filters.status
              ? 'No appointments match your search or filter criteria.'
              : tab === 'cancelled'
              ? 'You do not have any cancelled appointments.'
              : 'You do not have any scheduled appointments in this view.'
          }
          action={
            <Button as={Link} to="/patient/book" variant="primary" size="sm">
              Book a new appointment
            </Button>
          }
        />
      ) : (
        <>
          <div className="d-flex flex-column gap-3 mb-4">
            {appointments.map((appt) => (
              <AppointmentCard
                key={appt._id}
                appointment={appt}
                to={`/patient/appointments/${appt._id}`}
                showDentistPortrait
                actions={
                  canPatientChange(appt) && (
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setRescheduleTarget(appt);
                        }}
                      >
                        Reschedule
                      </Button>
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
                    </div>
                  )
                }
              />
            ))}
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} itemLabel="appointments" />
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
