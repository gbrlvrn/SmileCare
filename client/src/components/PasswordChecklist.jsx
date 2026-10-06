import { CheckCircleFill, Circle } from 'react-bootstrap-icons';
import { getPasswordChecks } from '../utils/validators';

/**
 * Live checklist of the password rules (turns green as each rule is met).
 * @param {object} props
 * @param {string} props.password current password value
 * @param {string} [props.id] id so an input can reference it with aria-describedby
 */
export default function PasswordChecklist({ password = '', id }) {
  const checks = getPasswordChecks(password);
  return (
    <ul className="sc-password-checklist" id={id} aria-label="Password requirements">
      {checks.map((check) => (
        <li key={check.id} className={check.passed ? 'is-met' : ''}>
          {check.passed ? (
            <CheckCircleFill aria-hidden="true" />
          ) : (
            <Circle aria-hidden="true" />
          )}
          <span>
            {check.label}
            <span className="visually-hidden">{check.passed ? ' (met)' : ' (not met)'}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
