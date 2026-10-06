import { Spinner } from 'react-bootstrap';

/**
 * Loading indicator.
 * @param {object} props
 * @param {boolean} [props.fullPage=false] cover the whole viewport (used while restoring the session)
 * @param {string} [props.label='Loading…'] text for screen readers (and shown under the spinner)
 * @param {string} [props.className]
 */
export default function Loader({ fullPage = false, label = 'Loading…', className = '' }) {
  return (
    <div
      className={`sc-loader ${fullPage ? 'sc-loader-full' : 'py-5'} ${className}`}
      role="status"
      aria-live="polite"
    >
      <Spinner animation="border" variant="primary" aria-hidden="true" />
      <span className="mt-3 text-muted small">{label}</span>
    </div>
  );
}
