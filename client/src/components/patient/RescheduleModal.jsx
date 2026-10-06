import { useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { updateAppointment } from '../../api/appointmentApi';
import { getErrorMessage } from '../../api/errors';
import FormInput from '../FormInput';
import TimeSlotPicker from '../TimeSlotPicker';
import useToast from '../../hooks/useToast';
import {
  addDaysISO,
  formatDate,
  formatTime,
  formatTimeRange,
  formatWorkingDays,
  todayISO,
  weekdayOf,
} from '../../utils/formatters';
import { dentistLabel, serviceLabel } from './appointmentRules';
import useAvailability from './useAvailability';

/** How far ahead patients can book or move an appointment. */
const MAX_DAYS_AHEAD = 60;

/**
 * Dialog to move an appointment to another date/time with the same dentist and service.
 * Uses the availability endpoint with `excludeAppointmentId`, so the appointment's own
 * slot is not treated as taken. Render it only while open so the form starts fresh.
 *
 * @param {object} props
 * @param {object} props.appointment populated appointment (dentist and service must exist)
 * @param {() => void} props.onClose
 * @param {() => void} props.onRescheduled called after a successful PUT /appointments/:id
 */
export default function RescheduleModal({ appointment, onClose, onRescheduled }) {
  const { showToast } = useToast();
  const minDate = todayISO();
  const maxDate = addDaysISO(minDate, MAX_DAYS_AHEAD);

  const [date, setDate] = useState(appointment.date >= minDate ? appointment.date : '');
  const [startTime, setStartTime] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { dentist, service } = appointment;
  const availability = useAvailability({
    dentistId: dentist?._id,
    serviceId: service?._id,
    date,
    excludeAppointmentId: appointment._id,
  });

  const handleDateChange = (event) => {
    setDate(event.target.value);
    setStartTime(''); // a new date means the old time may not exist
    setFieldError('');
  };

  const handleTimeChange = (value) => {
    setStartTime(value);
    setFieldError('');
  };

  /** Returns a message when the form is not ready to submit. */
  const validate = () => {
    if (!date) return 'Please choose a date.';
    if (date < minDate || date > maxDate) return `Choose a date within the next ${MAX_DAYS_AHEAD} days.`;
    if (!startTime) return 'Please choose a time slot.';
    if (date === appointment.date && startTime === appointment.startTime) {
      return 'This is your current schedule. Choose a different date or time.';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = validate();
    if (message) {
      setFieldError(message);
      return;
    }

    setSubmitting(true);
    setServerError('');
    try {
      await updateAppointment(appointment._id, { date, startTime });
      showToast({
        type: 'success',
        message: `Rescheduled to ${formatDate(date, { weekday: 'short' })} at ${formatTime(startTime)}.`,
      });
      onRescheduled();
    } catch (err) {
      if (err.response?.status === 409) {
        // Someone else just took this slot → refresh the grid and let the patient pick again.
        setServerError('Sorry, that time was just booked. Please choose another slot.');
        setStartTime('');
        availability.refetch();
      } else {
        setServerError(getErrorMessage(err));
      }
      setSubmitting(false);
    }
  };

  // Friendly hint before even asking the server.
  const weekday = date ? weekdayOf(date) : null;
  let dayHint = '';
  if (weekday === 0) dayHint = 'The clinic is closed on Sundays.';
  else if (weekday !== null && dentist?.workingDays && !dentist.workingDays.includes(weekday)) {
    dayHint = `${dentistLabel(dentist)} works ${formatWorkingDays(dentist.workingDays)}.`;
  }

  return (
    <Modal show onHide={submitting ? undefined : onClose} centered size="lg" aria-labelledby="reschedule-title">
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title id="reschedule-title" as="h2" className="h5">
            Reschedule appointment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="sc-note-box mb-3">
            <div className="fw-semibold">{serviceLabel(service)}</div>
            <div className="text-muted small">
              with {dentistLabel(dentist)} · currently {formatDate(appointment.date, { weekday: 'short' })},{' '}
              {formatTimeRange(appointment.startTime, appointment.endTime)}
            </div>
          </div>

          {serverError && (
            <Alert variant="danger" className="small">
              {serverError}
            </Alert>
          )}

          <FormInput
            label="New date"
            name="date"
            id="reschedule-date"
            type="date"
            required
            min={minDate}
            max={maxDate}
            value={date}
            onChange={handleDateChange}
            helpText={dayHint || `Up to ${MAX_DAYS_AHEAD} days ahead.`}
          />

          <h3 className="form-label d-block mb-2">
            Available times<span className="text-danger ms-1" aria-hidden="true">*</span>
          </h3>
          <div aria-live="polite" aria-busy={availability.loading}>
            {!date ? (
              <p className="text-muted small mb-0">Choose a date to see the available times.</p>
            ) : availability.error ? (
              <Alert variant="danger" className="small d-flex justify-content-between align-items-center gap-2">
                {availability.error}
                <Button size="sm" variant="outline-danger" onClick={availability.refetch}>
                  Retry
                </Button>
              </Alert>
            ) : (
              <TimeSlotPicker
                slots={availability.slots}
                value={startTime}
                onChange={handleTimeChange}
                loading={availability.loading}
                emptyMessage={availability.message || undefined}
              />
            )}
          </div>

          {fieldError && (
            <div className="invalid-feedback d-block" role="alert">
              {fieldError}
            </div>
          )}

          <p className="small text-muted mt-3 mb-0">
            After rescheduling, your appointment goes back to <strong>Pending</strong> until the clinic confirms
            it.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={submitting}>
            Close
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />}
            Save new schedule
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
