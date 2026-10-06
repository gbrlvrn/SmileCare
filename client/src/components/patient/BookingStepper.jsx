import { CheckLg } from 'react-bootstrap-icons';
import './patient.css';

/**
 * Horizontal progress indicator for the booking wizard.
 * Finished steps are buttons, so the patient can jump back to them.
 * @param {object} props
 * @param {string[]} props.steps step labels, e.g. ['Service', 'Dentist', 'Date & time', 'Confirm']
 * @param {number} props.current index of the active step (0-based)
 * @param {(index: number) => void} [props.onStepClick] called when a finished step is clicked
 */
export default function BookingStepper({ steps, current, onStepClick }) {
  return (
    <nav aria-label="Booking progress">
      <ol className="sc-stepper">
        {steps.map((label, index) => {
          const state = index < current ? 'done' : index === current ? 'current' : 'upcoming';
          const content = (
            <>
              <span className="sc-step-circle" aria-hidden="true">
                {state === 'done' ? <CheckLg size={16} /> : index + 1}
              </span>
              <span>
                <span className="visually-hidden">
                  Step {index + 1}
                  {state === 'done' ? ' (completed)' : ''}:{' '}
                </span>
                {label}
              </span>
            </>
          );

          return (
            <li
              key={label}
              className={`sc-step is-${state}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {state === 'done' && onStepClick ? (
                <button type="button" className="sc-step-btn" onClick={() => onStepClick(index)}>
                  {content}
                </button>
              ) : (
                <span className="sc-step-btn">{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
