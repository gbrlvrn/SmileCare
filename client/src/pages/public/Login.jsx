import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import FormInput from '../../components/FormInput';
import PasswordInput from '../../components/PasswordInput';
import useAuth from '../../hooks/useAuth';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useForm from '../../hooks/useForm';
import useToast from '../../hooks/useToast';
import { getPostLoginPath } from '../../utils/redirect';
import { validateLogin } from '../../utils/validators';

/** Login page for patients and staff. */
export default function Login() {
  useDocumentTitle('Login');
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const sessionExpired = searchParams.get('session') === 'expired';
  const from = location.state?.from;

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: validateLogin,
    onSubmit: async (values) => {
      const user = await login(values.email.trim(), values.password);
      showToast({ type: 'success', message: `Welcome back, ${user.firstName}!` });
      navigate(getPostLoginPath(user, from), { replace: true });
    },
  });

  return (
    <>
      <div className="mb-4">
        <h1 className="sc-auth-title">Welcome back</h1>
        <p className="text-muted mb-0">Sign in to manage your appointments.</p>
      </div>

      {sessionExpired && !form.serverError && (
        <Alert variant="info" className="small">
          Your session has expired. Please sign in again.
        </Alert>
      )}
      {form.serverError && (
        <Alert variant="danger" className="small" role="alert">
          {form.serverError}
        </Alert>
      )}

      <Form noValidate onSubmit={form.handleSubmit} aria-label="Login form">
        <FormInput
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          autoFocus
          {...form.field('email')}
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
          {...form.field('password')}
        />

        <Button type="submit" className="w-100 mt-2" size="lg" disabled={form.submitting}>
          {form.submitting && (
            <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />
          )}
          {form.submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </Form>

      <p className="text-center text-muted mt-4 mb-0">
        New to SmileCare?{' '}
        <Link to="/register" state={location.state} className="fw-semibold">
          Create an account
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
