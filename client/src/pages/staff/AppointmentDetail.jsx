import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import {
  CalendarEvent,
  Clock,
  ExclamationTriangle,
  JournalMedical,
  Trash,
} from 'react-bootstrap-icons';
import { deleteAppointment, getAppointment, saveTreatment, updateAppointment } from '../../api/appointmentApi';
import { getErrorMessage } from '../../api/errors';
import EmptyState from '../../components/EmptyState';
import FormInput from '../../components/FormInput';
import Loader from '../../components/Loader';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import TimeSlotPicker from '../../components/TimeSlotPicker';
import DeleteConfirmModal from '../../components/staff/DeleteConfirmModal';
import StatusActionButtons from '../../components/staff/StatusActionButtons';
import StatusChangeModal from '../../components/staff/StatusChangeModal';
import useAppointmentActions from '../../components/staff/useAppointmentActions';
import useAvailability from '../../components/staff/useAvailability';
import useDeleteAction from '../../components/staff/useDeleteAction';
import useFetch from '../../hooks/useFetch';
import useToast from '../../hooks/useToast';
import {
  addDaysISO,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatTimeRange,
  fullName,
  initials,
  todayISO,
} from '../../utils/formatters';

export default function StaffAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: appointment, loading, error, refetch } = useFetch(
    () => getAppointment(id),
    [id],
  );

  const { changeStatus, busyId, modalProps } = useAppointmentActions({
    onChanged: refetch,
  });

  const deleteAction = useDeleteAction({
    deleteFn: (target) => deleteAppointment(target._id),
    successMessage: 'Appointment deleted.',
    onDeleted: () => navigate('/staff/appointments'),
  });

  // Treatment form state
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    diagnosis: '',
    procedure: '',
    notes: '',
    prescription: '',
    followUpDate: '',
  });
  const [treatmentSubmitting, setTreatmentSubmitting] = useState(false);
  const [treatmentError, setTreatmentError] = useState('');

  // Reschedule form state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  const minDate = todayISO();
  const maxDate = addDaysISO(minDate, 60);

  const availability = useAvailability({
    dentistId: appointment?.dentist?._id,
    serviceId: appointment?.service?._id,
    date: newDate,
    excludeAppointmentId: appointment?._id,
  });

  if (loading) return <Loader fullPage label="Loading appointment details..." />;

  if (error || !appointment) {
    return (
      <EmptyState
        icon={ExclamationTriangle}
        title="Appointment not found"
        message={error || 'This appointment does not exist.'}
        action={
          <Button as={Link} to="/staff/appointments" variant="primary">
            Back to appointments
          </Button>
        }
      />
    );
  }

  const {
    service,
    dentist,
    patient,
    status,
    date,
    startTime,
    endTime,
    reason,
    cancellationReason,
    treatment,
    createdAt,
  } = appointment;

  const isTerminal = ['completed', 'cancelled', 'no-show'].includes(status);

  const openTreatmentModal = () => {
    setTreatmentForm({
      diagnosis: treatment?.diagnosis || '',
      procedure: treatment?.procedure || '',
      notes: treatment?.notes || '',
      prescription: treatment?.prescription || '',
      followUpDate: treatment?.followUpDate ? treatment.followUpDate.split('T')[0] : '',
    });
    setTreatmentError('');
    setShowTreatmentModal(true);
  };

  const handleSaveTreatment = async (e) => {
    e.preventDefault();
    setTreatmentSubmitting(true);
    setTreatmentError('');

    try {
      await saveTreatment(appointment._id, {
        diagnosis: treatmentForm.diagnosis.trim(),
        procedure: treatmentForm.procedure.trim(),
        notes: treatmentForm.notes.trim(),
        prescription: treatmentForm.prescription.trim(),
        followUpDate: treatmentForm.followUpDate || null,
      });

      showToast({ type: 'success', message: 'Clinical treatment notes saved.' });
      setShowTreatmentModal(false);
      refetch();
    } catch (err) {
      setTreatmentError(getErrorMessage(err));
    } finally {
      setTreatmentSubmitting(false);
    }
  };

  const openRescheduleModal = () => {
    setNewDate(date >= minDate ? date : '');
    setNewStartTime('');
    setRescheduleError('');
    setShowRescheduleModal(true);
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!newDate || !newStartTime) {
      setRescheduleError('Please choose a valid date and available time slot.');
      return;
    }

    setRescheduleSubmitting(true);
    setRescheduleError('');

    try {
      await updateAppointment(appointment._id, {
        date: newDate,
        startTime: newStartTime,
      });

      showToast({ type: 'success', message: 'Appointment rescheduled successfully.' });
      setShowRescheduleModal(false);
      refetch();
    } catch (err) {
      setRescheduleError(getErrorMessage(err));
      if (err.response?.status === 409) {
        availability.refetch();
      }
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={service?.name || 'Appointment details'}
        subtitle={`Scheduled on ${formatDate(date, { weekday: 'long' })}`}
        backTo="/staff/appointments"
        backLabel="Back to appointments"
        actions={
          <div className="d-flex gap-2">
            {!isTerminal && (
              <Button variant="outline-primary" onClick={openRescheduleModal}>
                Edit / Reschedule
              </Button>
            )}
            <Button variant="outline-danger" onClick={() => deleteAction.open(appointment)}>
              <Trash className="me-1" />
              Delete
            </Button>
          </div>
        }
      />

      {/* Main content grid */}
      <Row className="g-4 mb-4">
        <Col lg={8}>
          {/* Appointment details card */}
          <div className="sc-card p-4 mb-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-2">
              <div>
                <span className="text-muted small d-block">Current status</span>
                <StatusBadge status={status} />
              </div>

              <div>
                <StatusActionButtons
                  appointment={appointment}
                  onChange={changeStatus}
                  busy={busyId === appointment._id}
                />
              </div>
            </div>

            {status === 'cancelled' && cancellationReason && (
              <Alert variant="secondary" className="mb-4">
                <strong>Reason for cancellation:</strong> {cancellationReason}
              </Alert>
            )}

            <h3 className="h6 fw-bold text-primary mb-3">Schedule & Timing</h3>
            <div className="p-3 bg-light rounded border mb-4">
              <Row className="g-3">
                <Col sm={6}>
                  <div className="d-flex align-items-center gap-2">
                    <CalendarEvent className="text-primary fs-5" />
                    <div>
                      <div className="small text-muted">Visit date</div>
                      <div className="fw-bold">{formatDate(date, { weekday: 'long' })}</div>
                    </div>
                  </div>
                </Col>

                <Col sm={6}>
                  <div className="d-flex align-items-center gap-2">
                    <Clock className="text-primary fs-5" />
                    <div>
                      <div className="small text-muted">Time range</div>
                      <div className="fw-bold">{formatTimeRange(startTime, endTime)}</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            <h3 className="h6 fw-bold text-primary mb-3">Service info</h3>
            <dl className="row small mb-4">
              <dt className="col-sm-4 text-muted">Service</dt>
              <dd className="col-sm-8 fw-semibold">{service?.name || 'N/A'}</dd>

              <dt className="col-sm-4 text-muted">Duration</dt>
              <dd className="col-sm-8">{formatDuration(service?.durationMinutes || 0)}</dd>

              <dt className="col-sm-4 text-muted">Standard rate</dt>
              <dd className="col-sm-8 fw-bold text-primary">{formatCurrency(service?.price || 0)}</dd>

              <dt className="col-sm-4 text-muted">Description</dt>
              <dd className="col-sm-8 text-muted">{service?.description || 'None'}</dd>
            </dl>

            <h3 className="h6 fw-bold text-primary mb-3">Patient visit reason</h3>
            <div className="p-3 bg-light rounded border small text-muted mb-3">
              {reason || 'No specific symptoms or notes were entered for this booking.'}
            </div>

            <div className="text-muted small">
              Created: {formatDateTime(createdAt)}
            </div>
          </div>

          {/* Treatment notes card */}
          <div className="sc-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <JournalMedical className="text-success fs-5" />
                <h3 className="h6 fw-bold mb-0">Clinical Treatment & Procedure Notes</h3>
              </div>
              {status === 'completed' && (
                <Button size="sm" variant="outline-primary" onClick={openTreatmentModal}>
                  {treatment ? 'Edit notes' : 'Add treatment notes'}
                </Button>
              )}
            </div>

            {status !== 'completed' ? (
              <div className="p-3 bg-light rounded text-muted small">
                Treatment notes can only be recorded once the appointment has been marked as <strong>Completed</strong>.
              </div>
            ) : treatment ? (
              <dl className="row small mb-0">
                <dt className="col-sm-3 text-muted">Diagnosis</dt>
                <dd className="col-sm-9 fw-semibold">{treatment.diagnosis}</dd>

                <dt className="col-sm-3 text-muted">Procedure performed</dt>
                <dd className="col-sm-9 fw-semibold">{treatment.procedure}</dd>

                {treatment.notes && (
                  <>
                    <dt className="col-sm-3 text-muted">Dentist notes</dt>
                    <dd className="col-sm-9">{treatment.notes}</dd>
                  </>
                )}

                {treatment.prescription && (
                  <>
                    <dt className="col-sm-3 text-muted">Prescription</dt>
                    <dd className="col-sm-9">{treatment.prescription}</dd>
                  </>
                )}

                {treatment.followUpDate && (
                  <>
                    <dt className="col-sm-3 text-muted">Follow-up date</dt>
                    <dd className="col-sm-9">{formatDate(treatment.followUpDate)}</dd>
                  </>
                )}
              </dl>
            ) : (
              <div className="p-3 bg-light rounded text-muted small text-center">
                No treatment notes recorded yet. Click &quot;Add treatment notes&quot; above to log the diagnosis and procedure.
              </div>
            )}
          </div>
        </Col>

        {/* Sidebar cards */}
        <Col lg={4}>
          {/* Patient Card */}
          <div className="sc-card p-4 mb-4">
            <h3 className="h6 fw-bold mb-3">Patient profile</h3>
            {patient ? (
              <div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="sc-avatar sc-avatar-lg" aria-hidden="true">
                    {initials(fullName(patient))}
                  </span>
                  <div>
                    <h4 className="h6 fw-bold mb-0">{fullName(patient)}</h4>
                    <span className="small text-muted">{patient.gender || 'Patient'}</span>
                  </div>
                </div>

                <div className="small text-muted mb-2">
                  <strong>Email:</strong> {patient.email}
                </div>
                {patient.phone && (
                  <div className="small text-muted mb-3">
                    <strong>Phone:</strong> {patient.phone}
                  </div>
                )}

                <Button
                  as={Link}
                  to={`/staff/patients/${patient._id}`}
                  variant="outline-secondary"
                  size="sm"
                  className="w-100"
                >
                  View patient history
                </Button>
              </div>
            ) : (
              <p className="small text-muted mb-0">Patient account no longer exists.</p>
            )}
          </div>

          {/* Dentist Card */}
          <div className="sc-card p-4">
            <h3 className="h6 fw-bold mb-3">Assigned dentist</h3>
            {dentist ? (
              <div>
                <h4 className="h6 fw-bold mb-1">{fullName(dentist)}</h4>
                <div className="badge bg-primary-subtle text-primary mb-2">
                  {dentist.specialization || 'General'}
                </div>
                <div className="small text-muted mb-2">{dentist.phone || dentist.email}</div>
              </div>
            ) : (
              <p className="small text-muted mb-0">Dentist details unavailable.</p>
            )}
          </div>
        </Col>
      </Row>

      {/* Treatment Modal */}
      <Modal show={showTreatmentModal} onHide={() => setShowTreatmentModal(false)} backdrop="static" centered>
        <Form onSubmit={handleSaveTreatment}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold">Clinical Treatment Notes</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {treatmentError && <Alert variant="danger">{treatmentError}</Alert>}

            <FormInput
              label="Diagnosis"
              name="diagnosis"
              value={treatmentForm.diagnosis}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, diagnosis: e.target.value })}
              required
              placeholder="e.g. Mild gingivitis, tooth decay on upper molar..."
            />

            <FormInput
              label="Procedure performed"
              name="procedure"
              value={treatmentForm.procedure}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, procedure: e.target.value })}
              required
              placeholder="e.g. Deep cleaning, composite filling..."
            />

            <FormInput
              label="Dentist clinical notes (optional)"
              name="notes"
              as="textarea"
              rows={3}
              value={treatmentForm.notes}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
              placeholder="Observations, patient reaction, recommendations..."
            />

            <FormInput
              label="Prescription / medication (optional)"
              name="prescription"
              as="textarea"
              rows={2}
              value={treatmentForm.prescription}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, prescription: e.target.value })}
              placeholder="e.g. Amoxicillin 500mg TID for 7 days..."
            />

            <FormInput
              label="Follow-up date (optional)"
              name="followUpDate"
              type="date"
              min={todayISO()}
              value={treatmentForm.followUpDate}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, followUpDate: e.target.value })}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowTreatmentModal(false)} disabled={treatmentSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={treatmentSubmitting}>
              {treatmentSubmitting ? 'Saving...' : 'Save treatment'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)} size="lg" centered backdrop="static">
        <Form onSubmit={handleReschedule}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold">Edit / Reschedule Appointment</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {rescheduleError && <Alert variant="danger">{rescheduleError}</Alert>}

            <Row className="g-3">
              <Col md={5}>
                <Form.Group controlId="reschedule-date">
                  <Form.Label className="fw-semibold">New date</Form.Label>
                  <Form.Control
                    type="date"
                    min={minDate}
                    max={maxDate}
                    value={newDate}
                    onChange={(e) => {
                      setNewDate(e.target.value);
                      setNewStartTime('');
                    }}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={7}>
                <Form.Label className="fw-semibold">Available time slot</Form.Label>
                {!newDate ? (
                  <div className="small text-muted p-3 border rounded bg-light">
                    Pick a date on the left to see available slots.
                  </div>
                ) : (
                  <TimeSlotPicker
                    slots={availability.slots}
                    value={newStartTime}
                    onChange={setNewStartTime}
                    loading={availability.loading}
                    emptyMessage={availability.message || 'No slots available for this date.'}
                    error={availability.error}
                  />
                )}
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowRescheduleModal(false)} disabled={rescheduleSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={rescheduleSubmitting || !newDate || !newStartTime}>
              {rescheduleSubmitting ? 'Saving...' : 'Update schedule'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Status dialog */}
      <StatusChangeModal {...modalProps} />

      {/* Delete confirmation dialog */}
      <DeleteConfirmModal
        action={deleteAction}
        title="Delete appointment?"
        body="This will permanently delete this appointment. This action cannot be undone."
      />
    </div>
  );
}
