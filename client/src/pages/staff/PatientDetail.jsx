import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Col, Row, Table } from 'react-bootstrap';
import {
  CalendarPlus,
  ExclamationTriangle,
  JournalMedical,
  Trash,
} from 'react-bootstrap-icons';
import { deletePatient, getPatient } from '../../api/patientApi';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import DeleteConfirmModal from '../../components/staff/DeleteConfirmModal';
import useDeleteAction from '../../components/staff/useDeleteAction';
import useFetch from '../../hooks/useFetch';
import {
  formatDate,
  formatTimeRange,
  fullName,
  initials,
} from '../../utils/formatters';

export default function StaffPatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useFetch(
    () => getPatient(id).then((res) => res.data),
    [id],
  );

  const [showBookingModal, setShowBookingModal] = useState(false);

  const deleteAction = useDeleteAction({
    deleteFn: (p) => deletePatient(p._id),
    successMessage: 'Patient and records deleted.',
    onDeleted: () => navigate('/staff/patients'),
  });

  if (loading) return <Loader fullPage label="Loading patient record..." />;

  if (error || !data) {
    return (
      <EmptyState
        icon={ExclamationTriangle}
        title="Patient not found"
        message={error || 'The requested patient profile does not exist.'}
        action={
          <Button as={Link} to="/staff/patients" variant="primary">
            Back to patients directory
          </Button>
        }
      />
    );
  }

  const patient = data.patient;
  const appointments = Array.isArray(data.appointments) ? data.appointments : [];

  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const upcomingCount = appointments.filter((a) => ['pending', 'confirmed'].includes(a.status)).length;

  return (
    <div>
      <PageHeader
        title={fullName(patient)}
        subtitle={`Patient profile & clinical history (${appointments.length} total visits)`}
        backTo="/staff/patients"
        backLabel="Back to patients directory"
        actions={
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => setShowBookingModal(true)}>
              <CalendarPlus className="me-2" />
              Book visit for patient
            </Button>
            <Button variant="outline-danger" onClick={() => deleteAction.open(patient)}>
              <Trash className="me-1" />
              Delete patient
            </Button>
          </div>
        }
      />

      {/* Patient info and stats */}
      <Row className="g-4 mb-4">
        {/* Left card: Demographics & Medical Notes */}
        <Col lg={4}>
          <div className="sc-card p-4 h-100">
            <div className="d-flex align-items-center gap-3 mb-4">
              <span className="sc-avatar sc-avatar-lg" aria-hidden="true">
                {initials(fullName(patient))}
              </span>
              <div>
                <h3 className="h5 fw-bold mb-0">{fullName(patient)}</h3>
                <span className={`badge ${patient.isActive ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                  {patient.isActive ? 'Active patient' : 'Inactive account'}
                </span>
              </div>
            </div>

            {patient.medicalNotes && (
              <Alert variant="warning" className="small mb-4">
                <strong>Medical Alert:</strong>
                <p className="mb-0 mt-1">{patient.medicalNotes}</p>
              </Alert>
            )}

            <h4 className="h6 fw-bold text-muted mb-3 text-uppercase small">Personal info</h4>
            <dl className="row small mb-0">
              <dt className="col-4 text-muted">Email</dt>
              <dd className="col-8 text-truncate">{patient.email}</dd>

              <dt className="col-4 text-muted">Phone</dt>
              <dd className="col-8 font-monospace">{patient.phone || '—'}</dd>

              <dt className="col-4 text-muted">Gender</dt>
              <dd className="col-8 text-capitalize">{patient.gender || '—'}</dd>

              <dt className="col-4 text-muted">Birth date</dt>
              <dd className="col-8">{formatDate(patient.dateOfBirth) || '—'}</dd>

              <dt className="col-4 text-muted">Address</dt>
              <dd className="col-8">{patient.address || '—'}</dd>

              <dt className="col-4 text-muted">Joined</dt>
              <dd className="col-8 text-muted">{formatDate(patient.createdAt)}</dd>
            </dl>
          </div>
        </Col>

        {/* Right card: Visit History Table */}
        <Col lg={8}>
          <div className="sc-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="h6 fw-bold mb-0">Appointment & Treatment history</h3>
                <div className="small text-muted">
                  {upcomingCount} upcoming &bull; {completedCount} completed visits
                </div>
              </div>
            </div>

            {appointments.length === 0 ? (
              <EmptyState
                icon={JournalMedical}
                title="No appointments recorded"
                message="This patient has no appointment history in the clinic."
                action={
                  <Button variant="primary" size="sm" onClick={() => setShowBookingModal(true)}>
                    Schedule first visit
                  </Button>
                }
              />
            ) : (
              <div className="table-responsive">
                <Table hover align="middle" className="sc-table mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Dentist</th>
                      <th>Service</th>
                      <th>Status</th>
                      <th className="text-end">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt._id}>
                        <td className="fw-semibold text-body small">
                          {formatDate(appt.date, { weekday: 'short' })}
                        </td>
                        <td className="small text-muted font-monospace">
                          {formatTimeRange(appt.startTime, appt.endTime)}
                        </td>
                        <td className="small text-muted">{fullName(appt.dentist)}</td>
                        <td className="small fw-semibold">{appt.service?.name}</td>
                        <td>
                          <StatusBadge status={appt.status} />
                        </td>
                        <td className="text-end">
                          <Button
                            as={Link}
                            to={`/staff/appointments/${appt._id}`}
                            variant="light"
                            size="sm"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Booking Modal with patient preselected */}
      {showBookingModal && (
        <AppointmentFormModal
          show={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          defaultPatient={patient}
          onSaved={() => {
            setShowBookingModal(false);
            refetch();
          }}
        />
      )}

      {/* Delete Patient Confirmation */}
      <DeleteConfirmModal
        action={deleteAction}
        title="Delete patient and all records?"
        body="This will permanently delete this patient profile and all appointment and treatment records. This action cannot be undone."
      />
    </div>
  );
}
