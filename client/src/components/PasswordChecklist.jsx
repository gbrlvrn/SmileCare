import { CheckCircleFill, Circle, XCircleFill } from 'react-bootstrap-icons';
import { getPasswordChecks } from '../utils/validators';

/**
 * Live checklist of password rules (grayed at first, turns green when met, red when unmet).
 * @param {object} props
 * @param {string} [props.password=''] current password value
 * @param {string} [props.confirmPassword] optional confirm password value to include matching rule
 * @param {string} [props.id] id so an input can reference it with aria-describedby
 */
export default function PasswordChecklist({ password = '', confirmPassword, id }) {
  const checks = getPasswordChecks(password, confirmPassword);
  return (
    <ul className="sc-password-checklist" id={id} aria-label="Password requirements">
      {checks.map((check) => {
        const isMet = check.status === 'met';
        const isUnmet = check.status === 'unmet';

        const itemClass = isMet
          ? 'is-met text-success'
          : isUnmet
            ? 'is-unmet text-danger'
            : 'is-neutral';

        return (
          <li key={check.id} className={itemClass}>
            {isMet ? (
              <CheckCircleFill className="sc-check-icon text-success" aria-hidden="true" />
            ) : isUnmet ? (
              <XCircleFill className="sc-check-icon text-danger" aria-hidden="true" />
            ) : (
              <Circle className="sc-check-icon" aria-hidden="true" />
            )}
            <span>
              {check.label}
              <span className="visually-hidden">
                {isMet ? ' (met)' : isUnmet ? ' (not met)' : ' (pending)'}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
