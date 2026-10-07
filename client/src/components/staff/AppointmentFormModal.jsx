import { useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { createAppointment } from '../../api/appointmentApi';
import { getDentists } from '../../api/dentistApi';
import { getErrorMessage } from '../../api/errors';
import { getServices } from '../../api/serviceApi';
import FormInput from '../FormInput';
import TimeSlotPicker from '../TimeSlotPicker';
import useFetch from '../../hooks/useFetch';
import useToast from '../../hooks/useToast';
import {
  addDaysISO,
  formatCurrency,
  formatDuration,
  formatTime,
  formatWorkingDays,
  fullName,
  todayISO,
} from '../../utils/formatters';
import PatientPicker from './PatientPicker';
import useAvailability from './useAvailability';

const MAX_DAYS_AHEAD = 60;

/**
 * Modal dialog for staff to book a new appointment on behalf of any patient.
 *
 * @param {object} props
 * @param {boolean} props.show
 * @param {() => void} props.onClose
 * @param {(appointment: object) => void} props.onSaved
 * @param {object} [props.defaultPatient] if opened from PatientDetail
 */
export default function AppointmentFormModal({ show, onClose, onSaved, defaultPatient = null }) {
  const { showToast } = useToast();
  const minDate = todayISO();
  const maxDate = addDaysISO(minDate, MAX_DAYS_AHEAD);

  const [patient, setPatient] = useState(defaultPatient);
  const [dentistId, setDentistId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch active dentists and services
  const { data: dentists } = useFetch(getDentists, []);
  const { data: services } = useFetch(getServices, []);

  const selectedDentist = dentists?.find((d) => d._id === dentistId) || null;

  const availability = useAvailability({
    dentistId,
    serviceId,
    date,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patient) {
      setError('Please select a patient.');
      return;
    }
    if (!dentistId) {
      setError('Please select a dentist.');
      return;
    }
    if (!serviceId) {
      setError('Please select a service.');
      return;
    }
    if (!date || !startTime) {
      setError('Please select an appointment date and available time slot.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        patient: patient._id,
        dentist: dentistId,
        service: serviceId,
        date,
        startTime,
        reason: reason.trim(),
        status: confirmed ? 'confirmed' : 'pending',
      };

      const res = await createAppointment(payload);
      showToast({ type: 'success', message: 'Appointment created successfully.' });
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
      if (err.response?.status === 409) {
        availability.refetch();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold">New appointment (Staff)</Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}

          <PatientPicker
            value={patient}
            onChange={(val) => {
              setPatient(val);
              setError('');
            }}
            locked={Boolean(defaultPatient)}
          />

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Group controlId="staff-book-service">
                <Form.Label className="fw-semibold">Dental service</Form.Label>
                <Form.Select
                  value={serviceId}
                  onChange={(e) => {
                    setServiceId(e.target.value);
                    setStartTime('');
                  }}
                  required
                >
                  <option value="">Select a service...</option>
                  {services?.map((svc) => (
                    <option key={svc._id} value={svc._id}>
                      {svc.name} — {formatDuration(svc.durationMinutes)} ({formatCurrency(svc.price)})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group controlId="staff-book-dentist">
                <Form.Label className="fw-semibold">Attending dentist</Form.Label>
                <Form.Select
                  value={dentistId}
                  onChange={(e) => {
                    setDentistId(e.target.value);
                    setStartTime('');
                  }}
                  required
                >
                  <option value="">Select a dentist...</option>
                  {dentists?.map((dent) => (
                    <option key={dent._id} value={dent._id}>
                      {fullName(dent)} ({dent.specialization || 'General'})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-5">
              <Form.Group controlId="staff-book-date">
                <Form.Label className="fw-semibold">Date</Form.Label>
                <Form.Control
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setStartTime('');
                  }}
                  required
                />
                {selectedDentist && (
                  <Form.Text className="text-muted d-block small mt-1">
                    Working days: {formatWorkingDays(selectedDentist.workingDays)} ({formatTime(selectedDentist.startTime)} – {formatTime(selectedDentist.endTime)})
                  </Form.Text>
                )}
              </Form.Group>
            </div>

            <div className="col-md-7">
              <Form.Label className="fw-semibold">Available time slot</Form.Label>
              {!dentistId || !serviceId || !date ? (
                <div className="small text-muted p-3 border rounded bg-light">
                  Select service, dentist, and date above to load available slots.
                </div>
              ) : (
                <TimeSlotPicker
                  slots={availability.slots}
                  value={startTime}
                  onChange={setStartTime}
                  loading={availability.loading}
                  emptyMessage={availability.message || 'No slots available for this date.'}
                  error={availability.error}
                />
              )}
            </div>
          </div>

          <FormInput
            label="Visit notes / clinical reason (optional)"
            name="reason"
            as="textarea"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Clinical details, patient request, symptoms..."
          />

          <Form.Check
            type="checkbox"
            id="staff-book-confirm"
            label="Immediately mark as Confirmed (skip Pending status)"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-2"
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting || !date || !startTime}>
            {submitting ? (
              <>
                <Spinner size="sm" animation="border" className="me-1" />
                Booking...
              </>
            ) : (
              'Create appointment'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
