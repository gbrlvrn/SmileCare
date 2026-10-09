import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useForm from '../hooks/useForm';
import useToast from '../hooks/useToast';
import { getPostLoginPath } from '../utils/redirect';
import { validateLogin, validateRegister } from '../utils/validators';
import FormInput from './FormInput';
import LockoutTimer from './LockoutTimer';
import Logo from './Logo';
import OtpVerification from './OtpVerification';
import PasswordChecklist from './PasswordChecklist';
import PasswordInput from './PasswordInput';
import { GenderFemale, GenderMale } from 'react-bootstrap-icons';
import { todayISO } from '../utils/formatters';

const INITIAL_REGISTER = {
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

function toRegisterPayload(values) {
  let cleanPhone = values.phone ? String(values.phone).replace(/\D/g, '') : '';
  if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);
  else if (cleanPhone.startsWith('63') && cleanPhone.length > 10) cleanPhone = cleanPhone.slice(2);

  const payload = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: cleanPhone ? `+63${cleanPhone}` : '',
    address: values.address ? values.address.trim() : '',
    dateOfBirth: values.dateOfBirth || null,
    gender: values.gender,
    password: values.password,
    confirmPassword: values.confirmPassword,
  };
  return payload;
}

/**
 * Modern Sliding Landscape Modal for Login and Sign Up.
 * Features a dual-panel layout where an interactive welcome overlay smoothly
 * slides between left and right to alternate between Sign In and Sign Up.
 */
export default function AuthModal({ show, mode = 'login', setMode, onHide, redirectPath }) {
  const { login, requestRegistrationOtp, verifyRegistrationOtp, resendRegistrationOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const signupContainerRef = useRef(null);

  const [regStep, setRegStep] = useState('form'); // 'form' | 'otp'
  const [pendingEmail, setPendingEmail] = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [totalLockout, setTotalLockout] = useState(60);
  const wasLockedRef = useRef(false);

  const sessionExpired = searchParams.get('session') === 'expired';

  // Login form handler
  const loginForm = useForm({
    initialValues: { email: '', password: '' },
    validate: validateLogin,
    showValid: false,
    onSubmit: async (values) => {
      try {
        const user = await login(values.email.trim(), values.password);
        showToast({ type: 'success', message: `Welcome back, ${user.firstName}!` });
        onHide();
        const target = redirectPath || getPostLoginPath(user, location.state?.from);
        navigate(target, { replace: true });
      } catch (err) {
        const retryAfter =
          err.response?.data?.retryAfter ||
          (err.response?.status === 423 || err.response?.status === 429 ? 60 : 0);
        if (retryAfter > 0) {
          const secs = Number(retryAfter);
          setLockoutSeconds(secs);
          setTotalLockout(secs);
        }
        throw err;
      }
    },
  });

  useEffect(() => {
    if (lockoutSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  useEffect(() => {
    if (lockoutSeconds > 0) {
      wasLockedRef.current = true;
    } else if (wasLockedRef.current && lockoutSeconds === 0) {
      wasLockedRef.current = false;
      loginForm.setServerError('Lockout expired. You may now attempt to sign in again.');
    }
  }, [lockoutSeconds, loginForm]);

  const handleHide = () => {
    setLockoutSeconds(0);
    wasLockedRef.current = false;
    onHide?.();
  };

  // Register form handler with real-time validation
  const registerForm = useForm({
    initialValues: INITIAL_REGISTER,
    validate: validateRegister,
    realtime: true,
    onSubmit: async (values) => {
      const payload = toRegisterPayload(values);
      await requestRegistrationOtp(payload);
      setPendingEmail(payload.email);
      setRegStep('otp');
    },
  });

  // Real-time input sanitizers
  const handleFirstNameChange = (e) => {
    const lettersOnly = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').slice(0, 30);
    registerForm.setFieldValue('firstName', lettersOnly);
  };

  const handleLastNameChange = (e) => {
    const lettersOnly = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').slice(0, 30);
    registerForm.setFieldValue('lastName', lettersOnly);
  };

  const handlePhoneChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.startsWith('0')) raw = raw.slice(1);
    else if (raw.startsWith('63') && raw.length > 10) raw = raw.slice(2);
    registerForm.setFieldValue('phone', raw.slice(0, 10));
  };

  const setLoginError = loginForm.setServerError;
  const setRegisterError = registerForm.setServerError;

  // Reset errors and scroll position when modal is opened or mode is switched
  useEffect(() => {
    setLoginError('');
    setRegisterError('');
    if (!show) {
      setRegStep('form');
    }
    if (mode === 'register' && signupContainerRef.current) {
      signupContainerRef.current.scrollTop = 0;
    }
  }, [mode, show, setLoginError, setRegisterError]);

  const isRegister = mode === 'register';

  return (
    <Modal
      show={show}
      onHide={handleHide}
      centered
      className="sc-auth-modal"
      dialogClassName="sc-auth-modal-landscape"
      backdropClassName="sc-auth-modal-backdrop"
      aria-labelledby="auth-modal-title"
    >
      <Modal.Body className="p-0">
        <div className={`sc-auth-sliding-box ${isRegister ? 'is-register' : 'is-login'}`}>
          {/* Close button */}
          <button
            type="button"
            className="sc-auth-close-btn"
            onClick={onHide}
            aria-label="Close authentication modal"
          >
            &times;
          </button>

          {/* LEFT FORM PANEL: Sign Up Form (Scrollable) */}
          <div ref={signupContainerRef} className="sc-auth-form-side sc-signup-side">
            <div className="sc-auth-side-inner">
              {regStep === 'otp' ? (
                <OtpVerification
                  email={pendingEmail}
                  onVerify={async (code) => {
                    const user = await verifyRegistrationOtp(pendingEmail, code);
                    showToast({ type: 'success', message: `Welcome to SmileCare, ${user.firstName}!` });
                    onHide();
                    setRegStep('form');
                    const target = redirectPath || getPostLoginPath(user, location.state?.from);
                    navigate(target, { replace: true });
                  }}
                  onResend={async () => {
                    return resendRegistrationOtp(pendingEmail);
                  }}
                  onBack={() => {
                    setRegStep('form');
                  }}
                />
              ) : (
                <>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <Logo />
                    <span className="badge bg-primary-subtle text-primary fw-semibold px-2 py-1">
                      New Patient
                    </span>
                  </div>

                  <h2 id="auth-modal-title" className="h4 fw-bold mb-1">
                    Create Account
                  </h2>
                  <p className="text-muted small mb-3">
                    Fill out your details to book and track visits online.
                  </p>

                  {registerForm.serverError && (
                    <Alert variant="danger" className="small py-2 mb-2" role="alert">
                      {registerForm.serverError}
                    </Alert>
                  )}

                  <Form noValidate onSubmit={registerForm.handleSubmit} aria-label="Registration form">
                    {/* Row 1: First & Last Name (Letters only, max 30) */}
                    <Row className="g-2">
                      <Col sm={6}>
                        <FormInput
                          label="First name"
                          type="text"
                          autoComplete="given-name"
                          placeholder="Juan"
                          maxLength={30}
                          required
                          autoFocus={isRegister}
                          groupClassName="mb-2"
                          {...registerForm.field('firstName')}
                          onChange={handleFirstNameChange}
                        />
                      </Col>
                      <Col sm={6}>
                        <FormInput
                          label="Last name"
                          type="text"
                          autoComplete="family-name"
                          placeholder="Dela Cruz"
                          maxLength={30}
                          required
                          groupClassName="mb-2"
                          {...registerForm.field('lastName')}
                          onChange={handleLastNameChange}
                        />
                      </Col>
                    </Row>

                    {/* Email Address (Require @ and real domain) */}
                    <FormInput
                      label="Email address"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      groupClassName="mb-2"
                      {...registerForm.field('email')}
                    />

                    {/* Mobile number below Email (+63 default, numbers only, max 10 digits) */}
                    <FormInput
                      label="Mobile number"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      prefix="+63"
                      placeholder="9171234567"
                      required
                      groupClassName="mb-2"
                      {...registerForm.field('phone')}
                      onChange={handlePhoneChange}
                    />

                    {/* Address below Mobile number */}
                    <FormInput
                      label="Address"
                      type="text"
                      autoComplete="street-address"
                      placeholder="e.g. 123 Rizal Ave, Quezon City"
                      maxLength={200}
                      required
                      groupClassName="mb-2"
                      {...registerForm.field('address')}
                    />

                    {/* Birth date below Address */}
                    <FormInput
                      label="Birth date"
                      type="date"
                      autoComplete="bday"
                      max={todayISO()}
                      required
                      groupClassName="mb-2"
                      {...registerForm.field('dateOfBirth')}
                    />

                    {/* Gender selection below Birth date */}
                    <Form.Group className="mb-2" controlId="register-gender">
                      <Form.Label id="register-gender-label" className="form-label fw-semibold mb-1">
                        Gender
                        <span className="text-danger ms-1" aria-hidden="true">
                          *
                        </span>
                      </Form.Label>
                      <div
                        role="radiogroup"
                        aria-labelledby="register-gender-label"
                        aria-required="true"
                        aria-describedby={registerForm.errors.gender ? 'register-gender-error' : undefined}
                        className="sc-gender-selector"
                      >
                        <label
                          htmlFor="register-gender-male"
                          onClick={() => registerForm.setFieldValue('gender', 'male')}
                          className={`sc-gender-option ${registerForm.values.gender === 'male' ? 'is-selected' : ''} ${registerForm.errors.gender ? 'is-invalid' : ''}`}
                        >
                          <input
                            type="radio"
                            id="register-gender-male"
                            name="gender"
                            value="male"
                            checked={registerForm.values.gender === 'male'}
                            onChange={registerForm.handleChange}
                            onBlur={registerForm.handleBlur}
                            className="form-check-input me-2"
                          />
                          <GenderMale className="sc-gender-icon me-1 text-primary" aria-hidden="true" />
                          <span>Male</span>
                        </label>

                        <label
                          htmlFor="register-gender-female"
                          onClick={() => registerForm.setFieldValue('gender', 'female')}
                          className={`sc-gender-option ${registerForm.values.gender === 'female' ? 'is-selected' : ''} ${registerForm.errors.gender ? 'is-invalid' : ''}`}
                        >
                          <input
                            type="radio"
                            id="register-gender-female"
                            name="gender"
                            value="female"
                            checked={registerForm.values.gender === 'female'}
                            onChange={registerForm.handleChange}
                            onBlur={registerForm.handleBlur}
                            className="form-check-input me-2"
                          />
                          <GenderFemale className="sc-gender-icon me-1 text-danger" aria-hidden="true" />
                          <span>Female</span>
                        </label>
                      </div>
                      {registerForm.errors.gender && (
                        <div id="register-gender-error" className="text-danger small mt-1 fw-medium" role="alert">
                          {registerForm.errors.gender}
                        </div>
                      )}
                    </Form.Group>

                    {/* Password below Mobile (5 requirements checklist) */}
                    <PasswordInput
                      label="Password"
                      autoComplete="new-password"
                      placeholder="Create password"
                      required
                      groupClassName="mb-2"
                      {...registerForm.field('password')}
                    />

                    {/* Confirm password below Password */}
                    <PasswordInput
                      label="Confirm password"
                      autoComplete="new-password"
                      placeholder="Confirm password"
                      required
                      groupClassName="mb-2"
                      {...registerForm.field('confirmPassword')}
                    />

                    {/* Live Password Requirements (grayed at first, turns green if right, red if not) */}
                    <div className="mb-3 pt-1">
                      <PasswordChecklist
                        password={registerForm.values.password}
                        confirmPassword={registerForm.values.confirmPassword}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-100"
                      size="lg"
                      disabled={registerForm.submitting}
                    >
                      {registerForm.submitting && (
                        <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />
                      )}
                      {registerForm.submitting ? 'Sending code…' : 'Create Account'}
                    </Button>

                    {/* Mobile switch trigger */}
                    <div className="d-md-none text-center mt-3">
                      <span className="text-muted small">Already have an account? </span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 fw-semibold align-baseline text-decoration-none"
                        onClick={() => setMode('login')}
                      >
                        Sign in
                      </button>
                    </div>
                  </Form>
                </>
              )}
            </div>
          </div>

          {/* RIGHT FORM PANEL: Sign In Form */}
          <div className="sc-auth-form-side sc-signin-side">
            <div className="sc-auth-side-inner">
              <div className="mb-3">
                <Logo />
              </div>

              <h2 className="h4 fw-bold mb-1">Welcome Back</h2>
              <p className="text-muted small mb-3">
                Sign in to manage appointments and dental records.
              </p>

              {sessionExpired && !loginForm.serverError && (
                <Alert variant="info" className="small py-2 mb-2">
                  Your session has expired. Please sign in again.
                </Alert>
              )}

              {lockoutSeconds > 0 ? (
                <>
                  <LockoutTimer
                    seconds={lockoutSeconds}
                    totalSeconds={totalLockout}
                    message={loginForm.serverError}
                  />
                  {/* Mobile switch trigger */}
                  <div className="d-md-none text-center mt-3">
                    <span className="text-muted small">New to SmileCare? </span>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 fw-semibold align-baseline text-decoration-none"
                      onClick={() => setMode('register')}
                    >
                      Create an account
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {loginForm.serverError && (
                    <Alert
                      variant={
                        loginForm.serverError.startsWith('Lockout expired')
                          ? 'info'
                          : 'danger'
                      }
                      className="small py-2 mb-2"
                      role="alert"
                    >
                      {loginForm.serverError}
                    </Alert>
                  )}

                  <Form noValidate onSubmit={loginForm.handleSubmit} aria-label="Login form">
                    <FormInput
                      label="Email address"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      autoFocus={!isRegister}
                      groupClassName="mb-3"
                      {...loginForm.field('email')}
                      isValid={false}
                    />

                    <PasswordInput
                      label="Password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      required
                      groupClassName="mb-4"
                      {...loginForm.field('password')}
                      isValid={false}
                    />

                    <Button
                      type="submit"
                      className="w-100"
                      size="lg"
                      disabled={loginForm.submitting}
                    >
                      {loginForm.submitting && (
                        <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />
                      )}
                      {loginForm.submitting ? 'Signing in…' : 'Sign In'}
                    </Button>

                    {/* Mobile switch trigger */}
                    <div className="d-md-none text-center mt-3">
                      <span className="text-muted small">New to SmileCare? </span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 fw-semibold align-baseline text-decoration-none"
                        onClick={() => setMode('register')}
                      >
                        Create an account
                      </button>
                    </div>
                  </Form>
                </>
              )}
            </div>
          </div>

          {/* SLIDING OVERLAY BANNER (Desktop/Tablet) */}
          <div className="sc-auth-overlay-track d-none d-md-block" aria-hidden="true">
            <div className="sc-auth-overlay-card">
              {/* LEFT OVERLAY VIEW (Displayed when on Login, sitting on Left) */}
              <div className="sc-auth-overlay-panel sc-overlay-left">
                <div className="sc-auth-overlay-content">
                  <Logo variant="light" className="mb-4" />
                  <h3 className="h3 fw-bold text-white mb-2">Hello, Friend!</h3>
                  <p className="text-white-50 mb-4 px-3">
                    Don't have an account yet? Create one in seconds to easily book and manage your dental care.
                  </p>
                  <Button
                    variant="outline-light"
                    size="lg"
                    className="rounded-pill px-4 fw-semibold"
                    onClick={() => setMode('register')}
                  >
                    Create Account
                  </Button>
                </div>
              </div>

              {/* RIGHT OVERLAY VIEW (Displayed when on Register, sitting on Right) */}
              <div className="sc-auth-overlay-panel sc-overlay-right">
                <div className="sc-auth-overlay-content">
                  <Logo variant="light" className="mb-4" />
                  <h3 className="h3 fw-bold text-white mb-2">Welcome Back!</h3>
                  <p className="text-white-50 mb-4 px-3">
                    Already registered with us? Sign in to manage your appointments and view clinical history.
                  </p>
                  <Button
                    variant="outline-light"
                    size="lg"
                    className="rounded-pill px-4 fw-semibold"
                    onClick={() => setMode('login')}
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
