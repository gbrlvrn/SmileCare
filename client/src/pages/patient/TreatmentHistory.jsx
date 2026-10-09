import { Link } from 'react-router-dom';
import { Button, Col, Row } from 'react-bootstrap';
import { JournalMedical } from 'react-bootstrap-icons';
import { getAppointments } from '../../api/appointmentApi';
import EmptyState from '../../components/EmptyState';
import TreatmentHistorySkeleton from '../../components/skeletons/TreatmentHistorySkeleton';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import SearchBar from '../../components/SearchBar';
import TreatmentDetails from '../../components/patient/TreatmentDetails';
import { dentistLabel, serviceLabel } from '../../components/patient/appointmentRules';
import useListQuery from '../../hooks/useListQuery';
import { formatDate, formatTimeRange } from '../../utils/formatters';
import '../../components/patient/patient.css';

export default function TreatmentHistory() {
  const {
    items: appointments,
    pagination,
    loading,
    error,
    setPage,
    search,
    setSearch,
    refetch,
  } = useListQuery(getAppointments, {
    initialFilters: { status: 'completed' },
    limit: 6,
  });

  return (
    <div>
      <PageHeader
        title="Treatment history"
        subtitle="Review your completed dental visits, diagnoses, procedures, and medical prescriptions."
      />

      <div className="sc-card mb-4 p-3">
        <Row className="g-3 align-items-center">
          <Col md={6}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search treatments by dentist or service..."
            />
          </Col>
        </Row>
      </div>

      {loading && appointments.length === 0 ? (
        <TreatmentHistorySkeleton count={3} />
      ) : error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={refetch}>
            Try again
          </Button>
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={JournalMedical}
          title={search ? 'No matching treatments' : 'No treatment history yet'}
          message={
            search
              ? 'No treatment records match your search criteria.'
              : 'You do not have any completed visits with recorded treatment history yet.'
          }
          action={
            <Button as={Link} to="/patient/book" variant="primary" size="sm">
              Schedule an appointment
            </Button>
          }
        />
      ) : (
        <>
          <div className="d-flex flex-column gap-4 mb-4">
            {appointments.map((appt) => (
              <div key={appt._id} className="sc-card p-4">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center pb-3 mb-3 border-bottom gap-2">
                  <div>
                    <span className="badge bg-success-subtle text-success mb-1">Completed</span>
                    <h3 className="h5 fw-bold mb-0 text-primary">{serviceLabel(appt.service)}</h3>
                    <div className="text-muted small">Attending: {dentistLabel(appt.dentist)}</div>
                  </div>

                  <div className="text-sm-end">
                    <div className="fw-semibold text-body">
                      {formatDate(appt.date, { weekday: 'short' })}
                    </div>
                    <div className="small text-muted">{formatTimeRange(appt.startTime, appt.endTime)}</div>
                  </div>
                </div>

                {appt.treatment ? (
                  <TreatmentDetails treatment={appt.treatment} />
                ) : (
                  <p className="text-muted small mb-0 fst-italic">
                    No clinical treatment notes were filed for this visit.
                  </p>
                )}

                <div className="mt-3 pt-3 border-top text-end">
                  <Button
                    as={Link}
                    to={`/patient/appointments/${appt._id}`}
                    variant="link"
                    className="p-0 text-decoration-none small fw-semibold"
                  >
                    View visit details &rarr;
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} itemLabel="records" />
        </>
      )}
    </div>
  );
}
