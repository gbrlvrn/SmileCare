import { useState } from 'react';
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormInput from '../../components/FormInput';
import OtpVerification from '../../components/OtpVerification';
import PasswordChecklist from '../../components/PasswordChecklist';
import PasswordInput from '../../components/PasswordInput';
import useAuth from '../../hooks/useAuth';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useForm from '../../hooks/useForm';
import useToast from '../../hooks/useToast';
import { todayISO } from '../../utils/formatters';
import { getPostLoginPath } from '../../utils/redirect';
import { validateRegister } from '../../utils/validators';
import { GenderFemale, GenderMale } from 'react-bootstrap-icons';

const INITIAL_VALUES = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  gender: '',
  password: '',
  confirmPassword: '',
};

/** Builds the API payload: trims text and leaves out empty optional fields. */
function toPayload(values) {
  const payload = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    password: values.password,
    confirmPassword: values.confirmPassword,
  };
  if (values.phone.trim()) payload.phone = values.phone.trim();
  if (values.address?.trim()) payload.address = values.address.trim();
  if (values.dateOfBirth) payload.dateOfBirth = values.dateOfBirth;
  if (values.gender) payload.gender = values.gender;
  return payload;
}

/** Patient self-registration page. */
export default function Register() {
  useDocumentTitle('Create account');
  const { requestRegistrationOtp, verifyRegistrationOtp, resendRegistrationOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState('form');
  const [pendingEmail, setPendingEmail] = useState('');

  const form = useForm({
    initialValues: INITIAL_VALUES,
    validate: validateRegister,
    onSubmit: async (values) => {
      const payload = toPayload(values);
      await requestRegistrationOtp(payload);
      setPendingEmail(payload.email);
      setStep('otp');
    },
  });

  if (step === 'otp') {
    return (
      <div className="sc-auth-form-wrap">
        <OtpVerification
          email={pendingEmail}
          onVerify={async (code) => {
            const user = await verifyRegistrationOtp(pendingEmail, code);
            showToast({ type: 'success', message: `Welcome to SmileCare, ${user.firstName}!` });
            navigate(getPostLoginPath(user, location.state?.from), { replace: true });
          }}
          onResend={() => resendRegistrationOtp(pendingEmail)}
          onBack={() => setStep('form')}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="sc-auth-title">Create your account</h1>
        <p className="text-muted mb-0">Book and manage your dental appointments online.</p>
      </div>

      {form.serverError && (
        <Alert variant="danger" className="small" role="alert">
          {form.serverError}
        </Alert>
      )}

      <Form noValidate onSubmit={form.handleSubmit} aria-label="Registration form">
        <Row className="g-3">
          <Col sm={6}>
            <FormInput
              label="First name"
              autoComplete="given-name"
              required
              groupClassName=""
              {...form.field('firstName')}
            />
          </Col>
          <Col sm={6}>
            <FormInput
              label="Last name"
              autoComplete="family-name"
              required
              groupClassName=""
              {...form.field('lastName')}
            />
          </Col>
          <Col xs={12}>
            <FormInput
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
              groupClassName=""
              {...form.field('email')}
            />
          </Col>
          <Col xs={12}>
            <FormInput
              label="Mobile number"
              type="tel"
              autoComplete="tel"
              placeholder="09XXXXXXXXX"
              required
              groupClassName=""
              {...form.field('phone')}
            />
          </Col>
          <Col xs={12}>
            <FormInput
              label="Address"
              type="text"
              autoComplete="street-address"
              placeholder="e.g. 123 Rizal Ave, Quezon City"
              maxLength={200}
              required
              groupClassName=""
              {...form.field('address')}
            />
          </Col>
          <Col xs={12}>
            <FormInput
              label="Birth date"
              type="date"
              max={todayISO()}
              required
              groupClassName=""
              {...form.field('dateOfBirth')}
            />
          </Col>
          <Col xs={12}>
            <Form.Group className="mb-2" controlId="reg-gender">
              <Form.Label id="reg-gender-label" className="form-label fw-semibold mb-1">
                Gender
                <span className="text-danger ms-1" aria-hidden="true">
                  *
                </span>
              </Form.Label>
              <div
                role="radiogroup"
                aria-labelledby="reg-gender-label"
                aria-required="true"
                aria-describedby={form.errors.gender ? 'reg-gender-error' : undefined}
                className="sc-gender-selector"
              >
                <label
                  htmlFor="reg-gender-male"
                  onClick={() => form.setFieldValue('gender', 'male')}
                  className={`sc-gender-option ${form.values.gender === 'male' ? 'is-selected' : ''} ${form.errors.gender ? 'is-invalid' : ''}`}
                >
                  <input
                    type="radio"
                    id="reg-gender-male"
                    name="gender"
                    value="male"
                    checked={form.values.gender === 'male'}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className="form-check-input me-2"
                  />
                  <GenderMale className="sc-gender-icon me-1 text-primary" aria-hidden="true" />
                  <span>Male</span>
                </label>

                <label
                  htmlFor="reg-gender-female"
                  onClick={() => form.setFieldValue('gender', 'female')}
                  className={`sc-gender-option ${form.values.gender === 'female' ? 'is-selected' : ''} ${form.errors.gender ? 'is-invalid' : ''}`}
                >
                  <input
                    type="radio"
                    id="reg-gender-female"
                    name="gender"
                    value="female"
                    checked={form.values.gender === 'female'}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className="form-check-input me-2"
                  />
                  <GenderFemale className="sc-gender-icon me-1 text-danger" aria-hidden="true" />
                  <span>Female</span>
                </label>
              </div>
              {form.errors.gender && (
                <div id="reg-gender-error" className="text-danger small mt-1 fw-medium" role="alert">
                  {form.errors.gender}
                </div>
              )}
            </Form.Group>
          </Col>
          <Col xs={12}>
            <PasswordInput
              label="Password"
              autoComplete="new-password"
              required
              groupClassName="mb-2"
              {...form.field('password')}
            />
          </Col>
          <Col xs={12}>
            <PasswordInput
              label="Confirm password"
              autoComplete="new-password"
              required
              groupClassName="mb-2"
              aria-describedby="password-rules"
              {...form.field('confirmPassword')}
            />
            <PasswordChecklist
              id="password-rules"
              password={form.values.password}
              confirmPassword={form.values.confirmPassword}
            />
          </Col>
        </Row>

        <Button type="submit" className="w-100 mt-4" size="lg" disabled={form.submitting}>
          {form.submitting && (
            <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />
          )}
          {form.submitting ? 'Sending code…' : 'Create account'}
        </Button>
      </Form>

      <p className="text-center text-muted mt-4 mb-0">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="fw-semibold">
          Sign in
        </Link>
      </p>
      <p className="text-center mt-2 d-lg-none">
        <Link to="/" className="small text-muted">
          ← Back to website
        </Link>
      </p>
    </>
  );
}
