import { Form } from 'react-bootstrap';

/**
 * Labelled form field with inline validation message. Works with useForm:
 *   <FormInput label="Email" type="email" required {...form.field('email')} />
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} props.name input name (also used to build the id)
 * @param {string} [props.error] validation message; when set the field is red + aria-invalid
 * @param {'input'|'select'|'textarea'} [props.as='input']
 * @param {{ value: string|number, label: string }[]} [props.options] for as="select" (or pass <option> children)
 * @param {string} [props.placeholder] for selects this becomes the first empty option
 * @param {React.ReactNode} [props.helpText] small hint under the field (hidden while there is an error)
 * @param {boolean} [props.required] shows a * and sets aria-required
 * @param {boolean} [props.showCount] with maxLength: shows "12/500" under the field
 * @param {string} [props.groupClassName='mb-3'] class for the wrapping Form.Group
 * Any other prop (type, value, onChange, onBlur, rows, maxLength, disabled, autoComplete, min, max…)
 * is passed to the underlying Form.Control / Form.Select.
 */
export default function FormInput({
  label,
  name,
  error,
  as = 'input',
  options,
  children,
  placeholder,
  helpText,
  required = false,
  showCount = false,
  id,
  groupClassName = 'mb-3',
  'aria-describedby': extraDescribedBy,
  ...rest
}) {
  const controlId = id || `field-${name}`;
  const feedbackId = `${controlId}-error`;
  const helpId = `${controlId}-help`;
  const describedBy =
    [error ? feedbackId : null, helpText && !error ? helpId : null, extraDescribedBy]
      .filter(Boolean)
      .join(' ') || undefined;

  const commonProps = {
    name,
    isInvalid: Boolean(error),
    'aria-invalid': error ? true : undefined,
    'aria-required': required || undefined,
    'aria-describedby': describedBy,
    ...rest,
  };

  const length = String(rest.value ?? '').length;

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

      {as === 'select' ? (
        <Form.Select {...commonProps}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </Form.Select>
      ) : (
        <Form.Control
          as={as === 'textarea' ? 'textarea' : undefined}
          placeholder={placeholder}
          {...commonProps}
        />
      )}

      {(helpText && !error) || (showCount && rest.maxLength) ? (
        <div className="d-flex justify-content-between gap-2">
          {helpText && !error ? (
            <Form.Text id={helpId} muted>
              {helpText}
            </Form.Text>
          ) : (
            <span />
          )}
          {showCount && rest.maxLength && (
            <Form.Text muted aria-live="polite">
              {length}/{rest.maxLength}
            </Form.Text>
          )}
        </div>
      ) : null}

      <Form.Control.Feedback type="invalid" id={feedbackId}>
        {error}
      </Form.Control.Feedback>
    </Form.Group>
  );
}
