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
  const [serviceIds, setServiceIds] = useState([]);
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
  const selectedServices = services?.filter((s) => serviceIds.includes(s._id)) || [];
  const totalDuration = selectedServices.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalPrice = selectedServices.reduce((acc, s) => acc + (s.price || 0), 0);

  const availability = useAvailability({
    dentistId,
    serviceIds,
    date,
  });

  const toggleService = (id) => {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setStartTime('');
  };

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
    if (serviceIds.length === 0) {
      setError('Please select at least one dental service.');
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
        service: serviceIds[0],
        services: serviceIds,
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
                <Form.Label className="fw-semibold d-flex justify-content-between align-items-center mb-1">
                  <span>Dental service(s)</span>
                  {serviceIds.length > 0 && (
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                      {serviceIds.length} selected ({formatDuration(totalDuration)})
                    </span>
                  )}
                </Form.Label>
                <div
                  className="border rounded p-2 bg-white"
                  style={{ maxHeight: '150px', overflowY: 'auto' }}
                >
                  {services?.map((svc) => {
                    const checked = serviceIds.includes(svc._id);
                    return (
                      <div key={svc._id} className="form-check py-1 border-bottom">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`staff-svc-${svc._id}`}
                          checked={checked}
                          onChange={() => toggleService(svc._id)}
                        />
                        <label
                          className="form-check-label d-flex justify-content-between align-items-center w-100"
                          htmlFor={`staff-svc-${svc._id}`}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="fw-medium small">{svc.name}</span>
                          <span className="text-muted small">
                            {formatDuration(svc.durationMinutes)} &bull; {formatCurrency(svc.price)}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
                {serviceIds.length > 0 && (
                  <div className="small text-muted mt-1 text-end">
                    Total: <strong className="text-primary">{formatCurrency(totalPrice)}</strong>
                  </div>
                )}
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
              {!dentistId || serviceIds.length === 0 || !date ? (
                <div className="small text-muted p-3 border rounded bg-light">
                  Select service(s), dentist, and date above to load available slots.
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
