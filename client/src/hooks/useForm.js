import { useCallback, useRef, useState } from 'react';
import { getErrorMessage, getFieldErrors } from '../api/errors';

/**
 * Small form helper built on useState (controlled inputs).
 *
 * Validation timing:
 *  - nothing is shown while the user types the first time,
 *  - a field's error appears after it loses focus (blur) or after the first submit,
 *  - from then on it updates live on every change.
 * Server 422 `errors[]` are mapped onto the matching fields; other errors become `serverError`.
 *
 * @example
 * const form = useForm({ initialValues: { email: '' }, validate: validateLogin, onSubmit: async (values) => {...} });
 * <Form noValidate onSubmit={form.handleSubmit}>
 *   <FormInput label="Email" type="email" {...form.field('email')} />
 *   <Button type="submit" disabled={form.submitting}>Save</Button>
 * </Form>
 *
 * @param {{
 *   initialValues: object,
 *   validate?: (values: object) => Record<string, string>,  // returns {} when valid
 *   onSubmit: (values: object, helpers: { setFieldErrors, setServerError, reset }) => Promise<void>|void
 * }} config  If onSubmit throws an axios error it is handled automatically.
 * @returns {{
 *   values, setValues, setFieldValue(name, value),
 *   errors,                 // visible errors { field: message }
 *   handleChange(e), handleBlur(e), handleSubmit(e),
 *   field(name) => { name, value, onChange, onBlur, error },  // spread into <FormInput>
 *   submitting: boolean, serverError: string, setServerError, setFieldErrors, reset(nextValues?)
 * }}
 */
export default function useForm({
  initialValues,
  validate = () => ({}),
  onSubmit,
  realtime = false,
  showValid = true,
}) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const initialValuesRef = useRef(initialValues);

  // Client errors are derived from the current values on every render (no extra state needed).
  const clientErrors = validate(values);

  // Visible errors: server errors win, client errors only for touched fields or after submit.
  const errors = {};
  for (const name of new Set([...Object.keys(clientErrors), ...Object.keys(serverFieldErrors)])) {
    if (serverFieldErrors[name]) errors[name] = serverFieldErrors[name];
    else if (submitted || touched[name]) errors[name] = clientErrors[name];
  }

  const clearServerError = (name) => {
    setServerFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setFieldValue = useCallback(
    (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      clearServerError(name);
      setServerError('');
      if (realtime) {
        setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
      }
    },
    [realtime]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setValues((prev) => ({ ...prev, [name]: finalValue }));
    clearServerError(name);
    setServerError('');
    if (realtime) {
      setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  };

  /** Resets the form. Pass new values (e.g. a freshly loaded record) or reuse the initial ones. */
  const reset = useCallback((nextValues) => {
    setValues(nextValues ?? initialValuesRef.current);
    setTouched({});
    setSubmitted(false);
    setServerFieldErrors({});
    setServerError('');
  }, []);

  const handleSubmit = async (event) => {
    event?.preventDefault();
    setSubmitted(true);
    setServerError('');

    if (Object.keys(clientErrors).length > 0) return; // stop: show inline errors

    setSubmitting(true);
    try {
      await onSubmit(values, { setFieldErrors: setServerFieldErrors, setServerError, reset });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      setServerFieldErrors(fieldErrors);
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  /** Props for a <FormInput>: name, value, onChange, onBlur, error, isInvalid, isValid. */
  const field = (name) => {
    const isTouched = Boolean(submitted || touched[name]);
    const val = values[name];
    const hasVal = val !== undefined && val !== null && String(val).trim() !== '';
    const err = errors[name];
    const isInvalid = Boolean(err);
    const isValid = Boolean(showValid && !serverError && isTouched && hasVal && !err && !clientErrors[name]);
    return {
      name,
      value: val ?? '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: err,
      isInvalid,
      isValid,
    };
  };

  return {
    values,
    setValues,
    setFieldValue,
    errors,
    clientErrors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    field,
    submitting,
    serverError,
    setServerError,
    setFieldErrors: setServerFieldErrors,
    reset,
  };
}
