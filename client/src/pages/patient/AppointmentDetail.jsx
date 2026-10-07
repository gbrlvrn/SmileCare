import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Col, Row } from 'react-bootstrap';
import {
  CalendarEvent,
  Clock,
  ExclamationTriangle,
  InfoCircle,
  JournalMedical,
  PersonBadge,
  Telephone,
} from 'react-bootstrap-icons';
import { getAppointment } from '../../api/appointmentApi';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import CancelAppointmentModal from '../../components/patient/CancelAppointmentModal';
import RescheduleModal from '../../components/patient/RescheduleModal';
import TreatmentDetails from '../../components/patient/TreatmentDetails';
import {
  canPatientChange,
  changeBlockedReason,
  dentistLabel,
  serviceLabel,
} from '../../components/patient/appointmentRules';
import useFetch from '../../hooks/useFetch';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatTimeRange,
} from '../../utils/formatters';
import '../../components/patient/patient.css';

export default function AppointmentDetail() {
  const { id } = useParams();
  const { data: appointment, loading, error, refetch } = useFetch(
    () => getAppointment(id),
    [id],
  );

  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  if (loading) {
    return <Loader fullPage label="Loading appointment details..." />;
  }

  if (error || !appointment) {
    return (
      <EmptyState
        icon={ExclamationTriangle}
        title="Appointment not found"
        message={error || 'This appointment does not exist or you do not have permission to view it.'}
        action={
          <Button as={Link} to="/patient/appointments" variant="primary">
            Back to my appointments
          </Button>
        }
      />
    );
  }

  const { service, dentist, status, date, startTime, endTime, reason, cancellationReason, treatment, createdAt } =
    appointment;

  const editable = canPatientChange(appointment);
  const blockedNotice = changeBlockedReason(appointment);

  return (
    <div>
      <PageHeader
        title={serviceLabel(service)}
        subtitle={`Scheduled on ${formatDate(date, { weekday: 'long' })}`}
        backTo="/patient/appointments"
        backLabel="Back to appointments"
        actions={
          editable && (
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={() => setShowReschedule(true)}>
                Reschedule
              </Button>
              <Button variant="outline-danger" onClick={() => setShowCancel(true)}>
                Cancel appointment
              </Button>
            </div>
          )
        }
      />

      {blockedNotice && (
        <Alert variant="warning" className="d-flex align-items-center gap-2 mb-4">
          <InfoCircle className="flex-shrink-0 fs-5" />
          <div>{blockedNotice}</div>
        </Alert>
      )}

      {status === 'cancelled' && cancellationReason && (
        <Alert variant="secondary" className="mb-4">
          <strong>Cancellation reason:</strong> {cancellationReason}
        </Alert>
      )}

      <Row className="g-4 mb-4">
        {/* Main Details Card */}
        <Col lg={8}>
          <div className="sc-card mb-4 p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
              <div>
                <span className="text-muted small d-block">Status</span>
                <StatusBadge status={status} />
              </div>
              <div className="text-end">
                <span className="text-muted small d-block">Booked on</span>
                <span className="small fw-semibold">{formatDateTime(createdAt)}</span>
              </div>
            </div>

            <h3 className="h6 fw-bold text-primary mb-3">Appointment schedule</h3>
            <div className="p-3 rounded bg-light border mb-4">
              <Row className="g-3">
                <Col sm={6}>
                  <div className="d-flex align-items-center gap-2">
                    <CalendarEvent className="text-primary fs-5" />
                    <div>
                      <div className="small text-muted">Date</div>
                      <div className="fw-bold">{formatDate(date, { weekday: 'long' })}</div>
                    </div>
                  </div>
                </Col>

                <Col sm={6}>
                  <div className="d-flex align-items-center gap-2">
                    <Clock className="text-primary fs-5" />
                    <div>
                      <div className="small text-muted">Time</div>
                      <div className="fw-bold">{formatTimeRange(startTime, endTime)}</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            <h3 className="h6 fw-bold text-primary mb-3">Service details</h3>
            <dl className="row small mb-4">
              <dt className="col-sm-4 text-muted">Service name</dt>
              <dd className="col-sm-8 fw-semibold">{serviceLabel(service)}</dd>

              <dt className="col-sm-4 text-muted">Description</dt>
              <dd className="col-sm-8 text-muted">{service?.description || 'Standard clinic dental treatment.'}</dd>

              <dt className="col-sm-4 text-muted">Duration</dt>
              <dd className="col-sm-8">{formatDuration(service?.durationMinutes || 30)}</dd>

              <dt className="col-sm-4 text-muted">Estimated fee</dt>
              <dd className="col-sm-8 fw-bold text-primary">{formatCurrency(service?.price || 0)}</dd>
            </dl>

            <h3 className="h6 fw-bold text-primary mb-3">Patient visit notes</h3>
            <div className="p-3 bg-light rounded border text-muted small">
              {reason || 'No specific symptoms or notes were provided for this appointment.'}
            </div>
          </div>

          {/* Treatment Details if completed */}
          {status === 'completed' && (
            <div className="sc-card p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <JournalMedical className="text-success fs-5" />
                <h3 className="h6 fw-bold mb-0">Treatment & Clinical Notes</h3>
              </div>

              {treatment ? (
                <TreatmentDetails treatment={treatment} />
              ) : (
                <p className="text-muted small mb-0">
                  Treatment notes have not yet been recorded by the clinic staff.
                </p>
              )}
            </div>
          )}
        </Col>

        {/* Sidebar: Dentist Info */}
        <Col lg={4}>
          <div className="sc-card p-4 mb-4">
            <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
              <PersonBadge className="text-primary" />
              Attending Dentist
            </h3>

            {dentist ? (
              <div>
                <h4 className="h5 fw-bold mb-1">{dentistLabel(dentist)}</h4>
                <div className="badge bg-primary-subtle text-primary mb-3">
                  {dentist.specialization || 'General Dentistry'}
                </div>

                <div className="small text-muted mb-3">{dentist.bio}</div>

                {dentist.phone && (
                  <div className="small d-flex align-items-center gap-2 text-muted mb-2">
                    <Telephone className="text-primary" />
                    <span>{dentist.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted small mb-0">Dentist details are no longer available in the system.</p>
            )}
          </div>
        </Col>
      </Row>

      {/* Reschedule Modal */}
      {showReschedule && (
        <RescheduleModal
          appointment={appointment}
          onClose={() => setShowReschedule(false)}
          onRescheduled={() => {
            setShowReschedule(false);
            refetch();
          }}
        />
      )}

      {/* Cancel Modal */}
      {showCancel && (
        <CancelAppointmentModal
          appointment={appointment}
          onClose={() => setShowCancel(false)}
          onCancelled={() => {
            setShowCancel(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
