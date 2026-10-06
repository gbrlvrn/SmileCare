import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle,
  Clock,
  ExclamationCircle,
} from 'react-bootstrap-icons';
import { createAppointment } from '../../api/appointmentApi';
import { getDentists } from '../../api/dentistApi';
import { getErrorMessage } from '../../api/errors';
import { getServices } from '../../api/serviceApi';
import FormInput from '../../components/FormInput';
import Loader from '../../components/Loader';
import PageHeader from '../../components/PageHeader';
import TimeSlotPicker from '../../components/TimeSlotPicker';
import BookingStepper from '../../components/patient/BookingStepper';
import OptionCard from '../../components/patient/OptionCard';
import useAvailability from '../../components/patient/useAvailability';
import useFetch from '../../hooks/useFetch';
import useToast from '../../hooks/useToast';
import {
  addDaysISO,
  formatCurrency,
  formatDate,
  formatDuration,
  formatTime,
  formatTimeRange,
  formatWorkingDays,
  fullName,
  todayISO,
} from '../../utils/formatters';
import '../../components/patient/patient.css';

const STEPS = ['Service', 'Dentist', 'Date & time', 'Confirm'];
const MAX_DAYS_AHEAD = 60;
const REASON_MAX = 500;

export default function BookAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [serviceId, setServiceId] = useState(searchParams.get('service') || '');
  const [dentistId, setDentistId] = useState(searchParams.get('dentist') || '');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [reason, setReason] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [stepError, setStepError] = useState('');

  const minDate = todayISO();
  const maxDate = addDaysISO(minDate, MAX_DAYS_AHEAD);

  // Fetch available active services & dentists
  const { data: services, loading: loadingServices, error: serviceError } = useFetch(
    () => getServices().then((res) => (Array.isArray(res.data) ? res.data : [])),
    [],
  );

  const { data: dentists, loading: loadingDentists, error: dentistError } = useFetch(
    () => getDentists().then((res) => (Array.isArray(res.data) ? res.data : [])),
    [],
  );

  const selectedService = services?.find((s) => s._id === serviceId) || null;
  const selectedDentist = dentists?.find((d) => d._id === dentistId) || null;

  // Time slots availability
  const availability = useAvailability({
    dentistId,
    serviceId,
    date,
  });

  // Calculate endTime based on startTime + service duration
  const selectedSlot = availability.slots.find((s) => s.startTime === startTime) || null;

  // Clear slot if date, dentist or service changes
  const handleServiceChange = (id) => {
    setServiceId(id);
    setStartTime('');
    setStepError('');
  };

  const handleDentistChange = (id) => {
    setDentistId(id);
    setStartTime('');
    setStepError('');
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setStartTime('');
    setStepError('');
  };

  // Step navigation guards
  const handleNext = () => {
    setStepError('');
    if (currentStep === 0) {
      if (!serviceId) {
        setStepError('Please select a dental service to continue.');
        return;
      }
    } else if (currentStep === 1) {
      if (!dentistId) {
        setStepError('Please choose a dentist for your appointment.');
        return;
      }
    } else if (currentStep === 2) {
      if (!date) {
        setStepError('Please choose an appointment date.');
        return;
      }
      if (!startTime) {
        setStepError('Please select an available time slot.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStepError('');
    setSubmitError('');
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);

    try {
      const res = await createAppointment({
        dentist: dentistId,
        service: serviceId,
        date,
        startTime,
        reason: reason.trim(),
      });

      showToast({
        type: 'success',
        message: 'Your appointment was successfully booked! Status is pending clinic confirmation.',
      });

      navigate(`/patient/appointments/${res.data._id}`);
    } catch (err) {
      const msg = getErrorMessage(err);
      setSubmitError(msg);
      // If 409 slot taken, offer to refetch and stay on date/time
      if (err.response?.status === 409) {
        availability.refetch();
        setCurrentStep(2); // Jump back to slot picker
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Book an appointment"
        subtitle="Schedule your dental consultation or treatment in just a few quick steps."
        backTo="/patient"
        backLabel="Back to dashboard"
      />

      <div className="sc-card mb-4 p-4">
        <BookingStepper steps={STEPS} current={currentStep} onStepClick={(step) => setCurrentStep(step)} />
      </div>

      {(serviceError || dentistError) && (
        <Alert variant="danger" className="mb-4">
          {serviceError || dentistError}
        </Alert>
      )}

      {stepError && (
        <Alert variant="warning" className="mb-4 d-flex align-items-center gap-2">
          <ExclamationCircle className="flex-shrink-0" />
          <div>{stepError}</div>
        </Alert>
      )}

      {submitError && (
        <Alert variant="danger" className="mb-4">
          {submitError}
        </Alert>
      )}

      {/* STEP 0: Select Service */}
      {currentStep === 0 && (
        <div className="sc-card p-4">
          <h2 className="h5 fw-bold mb-1">1. Select a dental service</h2>
          <p className="text-muted small mb-4">Choose the dental procedure or consultation you require.</p>

          {loadingServices ? (
            <Loader label="Loading services..." className="my-5" />
          ) : (
            <fieldset className="sc-option-grid">
              <legend className="visually-hidden">Dental services</legend>
              {services?.map((svc) => (
                <OptionCard
                  key={svc._id}
                  name="service"
                  value={svc._id}
                  checked={serviceId === svc._id}
                  onChange={handleServiceChange}
                  title={svc.name}
                  footer={
                    <span className="d-flex justify-content-between align-items-center w-100">
                      <span className="small text-muted">
                        <Clock className="me-1" />
                        {formatDuration(svc.durationMinutes)}
                      </span>
                      <strong className="text-primary">{formatCurrency(svc.price)}</strong>
                    </span>
                  }
                >
                  <p className="small text-muted mb-0">{svc.description || 'Standard clinic dental service.'}</p>
                </OptionCard>
              ))}
            </fieldset>
          )}

          <div className="d-flex justify-content-end mt-4 pt-3 border-top">
            <Button variant="primary" onClick={handleNext} disabled={!serviceId}>
              Continue to dentist <ArrowRight className="ms-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 1: Select Dentist */}
      {currentStep === 1 && (
        <div className="sc-card p-4">
          <h2 className="h5 fw-bold mb-1">2. Choose your dentist</h2>
          <p className="text-muted small mb-4">Select your preferred dental specialist.</p>

          {loadingDentists ? (
            <Loader label="Loading dentists..." className="my-5" />
          ) : (
            <fieldset className="sc-option-grid">
              <legend className="visually-hidden">Dentists</legend>
              {dentists?.map((dent) => (
                <OptionCard
                  key={dent._id}
                  name="dentist"
                  value={dent._id}
                  checked={dentistId === dent._id}
                  onChange={handleDentistChange}
                  title={fullName(dent)}
                  footer={
                    <span className="small text-muted">
                      Schedule: {formatWorkingDays(dent.workingDays)} ({formatTime(dent.startTime)} –{' '}
                      {formatTime(dent.endTime)})
                    </span>
                  }
                >
                  <div className="badge bg-primary-subtle text-primary mb-2 align-self-start">
                    {dent.specialization || 'General Dentistry'}
                  </div>
                  <p className="small text-muted mb-0">
                    {dent.bio || 'Experienced dental professional dedicated to quality oral care.'}
                  </p>
                </OptionCard>
              ))}
            </fieldset>
          )}

          <div className="d-flex justify-content-between mt-4 pt-3 border-top">
            <Button variant="outline-secondary" onClick={handleBack}>
              <ArrowLeft className="me-1" /> Back
            </Button>
            <Button variant="primary" onClick={handleNext} disabled={!dentistId}>
              Continue to date & time <ArrowRight className="ms-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Select Date & Time Slot */}
      {currentStep === 2 && (
        <div className="sc-card p-4">
          <h2 className="h5 fw-bold mb-1">3. Select appointment date & time</h2>
          <p className="text-muted small mb-4">
            Pick a date within the next 60 days and select from the available time slots.
          </p>

          <Row className="g-4 mb-4">
            <Col md={5}>
              <Form.Group controlId="appointment-date" className="mb-3">
                <Form.Label className="fw-semibold">Appointment date</Form.Label>
                <Form.Control
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="form-control-lg"
                />
                <Form.Text className="text-muted">
                  Clinic hours: Mon–Sat 9:00 AM – 5:00 PM (Closed Sundays)
                </Form.Text>
              </Form.Group>

              {date && selectedDentist && (
                <div className="p-3 rounded bg-light border small">
                  <div className="fw-semibold text-body mb-1">{fullName(selectedDentist)}</div>
                  <div className="text-muted mb-2">Specialist: {selectedDentist.specialization}</div>
                  <div className="text-muted">
                    Working days: {formatWorkingDays(selectedDentist.workingDays)}
                  </div>
                </div>
              )}
            </Col>

            <Col md={7}>
              <Form.Label className="fw-semibold">Available time slots</Form.Label>
              {!date ? (
                <div className="p-4 border rounded text-center text-muted">
                  Please pick a date on the left to see available appointment slots.
                </div>
              ) : (
                <TimeSlotPicker
                  slots={availability.slots}
                  value={startTime}
                  onChange={(slot) => {
                    setStartTime(slot);
                    setStepError('');
                  }}
                  loading={availability.loading}
                  emptyMessage={
                    availability.message || 'No available slots for this date. Please choose another day.'
                  }
                  error={availability.error}
                />
              )}
            </Col>
          </Row>

          <div className="d-flex justify-content-between mt-4 pt-3 border-top">
            <Button variant="outline-secondary" onClick={handleBack}>
              <ArrowLeft className="me-1" /> Back
            </Button>
            <Button variant="primary" onClick={handleNext} disabled={!date || !startTime}>
              Review and confirm <ArrowRight className="ms-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Confirm & Summary */}
      {currentStep === 3 && (
        <div className="sc-card p-4">
          <h2 className="h5 fw-bold mb-1">4. Review and confirm booking</h2>
          <p className="text-muted small mb-4">Please verify your appointment details before submitting.</p>

          <Row className="g-4 mb-4">
            <Col md={7}>
              <div className="p-4 rounded border bg-light">
                <h3 className="h6 fw-bold text-primary mb-3">Appointment summary</h3>

                <dl className="row mb-0 small">
                  <dt className="col-sm-4 text-muted">Service</dt>
                  <dd className="col-sm-8 fw-semibold">{selectedService?.name}</dd>

                  <dt className="col-sm-4 text-muted">Estimated price</dt>
                  <dd className="col-sm-8 text-primary fw-bold">
                    {formatCurrency(selectedService?.price || 0)}
                  </dd>

                  <dt className="col-sm-4 text-muted">Duration</dt>
                  <dd className="col-sm-8">{formatDuration(selectedService?.durationMinutes || 0)}</dd>

                  <hr className="my-2" />

                  <dt className="col-sm-4 text-muted">Attending dentist</dt>
                  <dd className="col-sm-8 fw-semibold">{fullName(selectedDentist)}</dd>

                  <dt className="col-sm-4 text-muted">Specialization</dt>
                  <dd className="col-sm-8">{selectedDentist?.specialization}</dd>

                  <hr className="my-2" />

                  <dt className="col-sm-4 text-muted">Date</dt>
                  <dd className="col-sm-8 fw-semibold">{formatDate(date, { weekday: 'long' })}</dd>

                  <dt className="col-sm-4 text-muted">Time</dt>
                  <dd className="col-sm-8 fw-semibold">
                    {formatTimeRange(startTime, selectedSlot?.endTime || '')}
                  </dd>

                  <dt className="col-sm-4 text-muted">Status</dt>
                  <dd className="col-sm-8">
                    <span className="badge bg-warning text-dark">Pending clinic confirmation</span>
                  </dd>
                </dl>
              </div>
            </Col>

            <Col md={5}>
              <Form onSubmit={handleSubmit}>
                <FormInput
                  label="Reason for visit / symptoms (optional)"
                  name="reason"
                  id="booking-reason"
                  as="textarea"
                  rows={4}
                  maxLength={REASON_MAX}
                  showCount
                  placeholder="e.g. Tooth sensitivity, regular cleaning, chipped tooth..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={submitting}
                  helpText="Let the dental team know any specific concerns or pain."
                />

                <div className="small text-muted p-3 bg-light rounded border mb-3">
                  <CheckCircle className="text-success me-1" />
                  <strong>Notice:</strong> You can reschedule or cancel this appointment online anytime up to 24 hours
                  before the visit.
                </div>

                <div className="d-flex justify-content-between pt-3 border-top">
                  <Button variant="outline-secondary" onClick={handleBack} disabled={submitting}>
                    <ArrowLeft className="me-1" /> Back
                  </Button>
                  <Button variant="primary" type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-1" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="me-1" />
                        Confirm booking
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}
