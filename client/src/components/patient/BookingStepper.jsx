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
  const halfStepPercent = steps.length > 0 ? 100 / (2 * steps.length) : 0;
  const progressPercent = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 0;

  return (
    <nav aria-label="Booking progress" className="sc-stepper-nav">
      <div className="sc-stepper-container">
        {/* Continuous progress track behind the step circles */}
        <div
          className="sc-stepper-track"
          style={{ left: `${halfStepPercent}%`, right: `${halfStepPercent}%` }}
          aria-hidden="true"
        >
          <div
            className="sc-stepper-track-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <ol className="sc-stepper">
          {steps.map((label, index) => {
            const state = index < current ? 'done' : index === current ? 'current' : 'upcoming';
            const isClickable = state === 'done' && Boolean(onStepClick);

            const content = (
              <>
                <span className="sc-step-circle" aria-hidden="true">
                  {state === 'done' ? (
                    <CheckLg size={16} className="sc-step-check-icon" />
                  ) : (
                    <span className="sc-step-num">{index + 1}</span>
                  )}
                </span>
                <span className="sc-step-text">
                  <span className="sc-step-eyebrow">
                    {state === 'done' ? 'Completed' : `Step ${index + 1}`}
                  </span>
                  <span className="sc-step-label">{label}</span>
                  <span className="visually-hidden">
                    {state === 'done' ? ' (completed)' : state === 'current' ? ' (current step)' : ''}
                  </span>
                </span>
              </>
            );

            return (
              <li
                key={label}
                className={`sc-step is-${state}`}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                {isClickable ? (
                  <button
                    type="button"
                    className="sc-step-btn is-clickable"
                    onClick={() => onStepClick(index)}
                    title={`Return to step ${index + 1}: ${label}`}
                  >
                    {content}
                  </button>
                ) : (
                  <div className="sc-step-btn">{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
