import { CheckLg } from 'react-bootstrap-icons';
import './patient.css';

/**
 * A card that behaves like a radio button (used to pick a service or a dentist).
 * It wraps a visually hidden native <input type="radio">, so it works with the
 * keyboard (Tab to the group, arrow keys to move) and with screen readers.
 * Put several of them inside a <fieldset className="sc-option-grid"> with a <legend>.
 *
 * @param {object} props
 * @param {string} props.name radio group name, e.g. 'service'
 * @param {string} props.value value of this option (an id)
 * @param {boolean} props.checked
 * @param {(value: string) => void} props.onChange
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} [props.children] description / extra content
 * @param {React.ReactNode} [props.footer] bottom row (e.g. duration + price)
 */
export default function OptionCard({ name, value, checked, onChange, title, children, footer }) {
  const inputId = `${name}-${value}`;
  return (
    <label htmlFor={inputId} className={`sc-option-card ${checked ? 'is-selected' : ''}`}>
      <input
        id={inputId}
        type="radio"
        className="sc-option-input visually-hidden"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
      />
      <span className="sc-option-check" aria-hidden="true">
        {checked && <CheckLg size={12} />}
      </span>
      <span className="sc-option-title">{title}</span>
      {children}
      {footer && <span className="sc-option-footer">{footer}</span>}
    </label>
  );
}
