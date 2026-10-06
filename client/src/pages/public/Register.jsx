import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormInput from '../../components/FormInput';
import PasswordChecklist from '../../components/PasswordChecklist';
import PasswordInput from '../../components/PasswordInput';
import useAuth from '../../hooks/useAuth';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useForm from '../../hooks/useForm';
import useToast from '../../hooks/useToast';
import { GENDERS } from '../../utils/constants';
import { todayISO } from '../../utils/formatters';
import { getPostLoginPath } from '../../utils/redirect';
import { validateRegister } from '../../utils/validators';

const INITIAL_VALUES = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
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
  if (values.dateOfBirth) payload.dateOfBirth = values.dateOfBirth;
  if (values.gender) payload.gender = values.gender;
  return payload;
}

/** Patient self-registration page. */
export default function Register() {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm({
    initialValues: INITIAL_VALUES,
    validate: validateRegister,
    onSubmit: async (values) => {
      const user = await register(toPayload(values));
      showToast({ type: 'success', message: `Welcome to SmileCare, ${user.firstName}!` });
      navigate(getPostLoginPath(user, location.state?.from), { replace: true });
    },
  });

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
              placeholder="you@example.com"
              required
              groupClassName=""
              {...form.field('email')}
            />
          </Col>
          <Col sm={6}>
            <FormInput
              label="Mobile number"
              type="tel"
              autoComplete="tel"
              placeholder="09XXXXXXXXX"
              helpText="Optional"
              groupClassName=""
              {...form.field('phone')}
            />
          </Col>
          <Col sm={6}>
            <FormInput
              label="Date of birth"
              type="date"
              max={todayISO()}
              helpText="Optional"
              groupClassName=""
              {...form.field('dateOfBirth')}
            />
          </Col>
          <Col xs={12}>
            <FormInput
              label="Gender"
              as="select"
              placeholder="Prefer to skip"
              options={GENDERS}
              helpText="Optional"
              groupClassName=""
              {...form.field('gender')}
            />
          </Col>
          <Col xs={12}>
            <PasswordInput
              label="Password"
              autoComplete="new-password"
              required
              groupClassName="mb-2"
              aria-describedby="password-rules"
              {...form.field('password')}
            />
            <PasswordChecklist id="password-rules" password={form.values.password} />
          </Col>
          <Col xs={12}>
            <PasswordInput
              label="Confirm password"
              autoComplete="new-password"
              required
              groupClassName=""
              {...form.field('confirmPassword')}
            />
          </Col>
        </Row>

        <Button type="submit" className="w-100 mt-4" size="lg" disabled={form.submitting}>
          {form.submitting && (
            <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />
          )}
          {form.submitting ? 'Creating account…' : 'Create account'}
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
