import { useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';

/**
 * Password field with a show/hide toggle. Same API as FormInput:
 *   <PasswordInput label="Password" autoComplete="new-password" {...form.field('password')} />
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} props.name
 * @param {string} [props.error]
 * @param {React.ReactNode} [props.helpText]
 * @param {boolean} [props.required]
 * @param {string} [props.groupClassName='mb-3']
 * Other props (value, onChange, onBlur, autoComplete, placeholder…) go to the input.
 */
export default function PasswordInput({
  label,
  name,
  error,
  helpText,
  required = false,
  id,
  groupClassName = 'mb-3',
  'aria-describedby': extraDescribedBy,
  ...rest
}) {
  const [visible, setVisible] = useState(false);
  const controlId = id || `field-${name}`;
  const feedbackId = `${controlId}-error`;
  const helpId = `${controlId}-help`;
  const describedBy =
    [error ? feedbackId : null, helpText && !error ? helpId : null, extraDescribedBy]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <Form.Group className={groupClassName} controlId={controlId}>
      {label && (
        <Form.Label>
          {label}
          {required && (
            <span className="text-danger ms-1" aria-hidden="true">
              *
            </span>
          )}
        </Form.Label>
      )}
      <InputGroup hasValidation className="sc-password-group">
        <Form.Control
          type={visible ? 'text' : 'password'}
          name={name}
          isInvalid={Boolean(error)}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        <button
          type="button"
          className="btn sc-password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          aria-controls={controlId}
        >
          {visible ? <EyeSlash aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
        <Form.Control.Feedback type="invalid" id={feedbackId}>
          {error}
        </Form.Control.Feedback>
      </InputGroup>
      {helpText && !error && (
        <Form.Text id={helpId} muted>
          {helpText}
        </Form.Text>
      )}
    </Form.Group>
  );
}
