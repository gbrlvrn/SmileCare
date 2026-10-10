import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';

/**
 * 6-digit OTP verification screen with individual auto-advancing boxes,
 * paste support, resend countdown cooldown, and accessible navigation.
 */
export default function OtpVerification({
  email,
  onVerify,
  onResend,
  onBack,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for Resend Code
  useEffect(() => {
    if (timer <= 0) return undefined;
    const interval = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    setError('');
    setInfoMessage('');
    const clean = value.replace(/\D/g, '');

    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Single digit input
    const char = clean.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move to previous input and clear it
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;

    const next = [...digits];
    for (let i = 0; i < 6; i += 1) {
      next[i] = paste[i] || '';
    }
    setDigits(next);

    // Focus last filled digit or 6th box
    const focusIdx = Math.min(paste.length, 5);
    inputRefs.current[focusIdx]?.focus();

    // If complete 6-digit code pasted, auto-submit
    if (paste.length === 6) {
      submitOtp(paste);
    }
  };

  const submitOtp = async (codeToVerify) => {
    const code = codeToVerify || digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onVerify(code);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to verify code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    submitOtp();
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError('');
    setInfoMessage('');
    try {
      const res = await onResend();
      setTimer(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setInfoMessage('A fresh 6-digit verification code has been sent!');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to resend code. Please try again.'
      );
    } finally {
      setResending(false);
    }
  };

  const isComplete = digits.every((d) => d.trim() !== '');

  return (
    <div className="sc-otp-wrapper">
      <div className="text-center mb-4">
        <div className="sc-otp-icon-wrap mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="currentColor"
            viewBox="0 0 16 16"
            className="text-primary"
            aria-hidden="true"
          >
            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
          </svg>
        </div>

        <h3 className="h4 fw-bold mb-1">Verify Your Email</h3>
        <p className="text-muted small mb-1">
          We sent a 6-digit verification code to
        </p>
        <p className="fw-semibold text-dark small mb-2">
          {email}{' '}
          {onBack && (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 ms-1 align-baseline text-decoration-none"
              onClick={onBack}
            >
              (Edit)
            </button>
          )}
        </p>
        <p className="text-muted small" style={{ fontSize: '0.8rem' }}>
          Code expires in 10 minutes. Check your inbox or spam folder.
        </p>
      </div>

      {error && (
        <Alert variant="danger" className="small py-2 mb-3" role="alert">
          {error}
        </Alert>
      )}

      {infoMessage && (
        <Alert variant="success" className="small py-2 mb-3" role="status">
          {infoMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* 6 Digit Inputs */}
        <div
          className="sc-otp-input-group mb-4"
          onPaste={handlePaste}
          role="group"
          aria-label="6-digit verification code"
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              autoComplete="one-time-code"
              className={`sc-otp-digit ${digit ? 'is-filled' : ''}`}
              aria-label={`Digit ${index + 1} of 6`}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading}
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-100 mb-3 fw-semibold"
          disabled={!isComplete || loading}
        >
          {loading && (
            <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />
          )}
          {loading ? 'Verifying code…' : 'Verify & Create Account'}
        </Button>

        {/* Resend Code Section */}
        <div className="text-center">
          <span className="text-muted small">Didn't receive the code? </span>
          {timer > 0 ? (
            <span className="text-muted small fw-semibold">
              Resend in {timer}s
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 fw-semibold align-baseline text-decoration-none"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </div>

        {onBack && (
          <div className="text-center mt-3">
            <button
              type="button"
              className="btn btn-link btn-sm text-muted p-0 text-decoration-none"
              onClick={onBack}
            >
              ← Back to registration details
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
