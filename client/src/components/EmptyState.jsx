import { isValidElement } from 'react';
import { Inbox } from 'react-bootstrap-icons';

/**
 * Friendly placeholder for empty lists / no results / coming soon.
 * @param {object} props
 * @param {React.ElementType|React.ReactNode} [props.icon=Inbox] react-bootstrap-icons component (or element)
 * @param {string} props.title
 * @param {React.ReactNode} [props.message]
 * @param {React.ReactNode} [props.action] e.g. a <Button>
 * @param {string} [props.className]
 */
export default function EmptyState({ icon: Icon = Inbox, title, message, action, className = '' }) {
  return (
    <div className={`sc-empty-state ${className}`}>
      <div className="sc-empty-icon" aria-hidden="true">
        {isValidElement(Icon) ? Icon : <Icon size={28} />}
      </div>
      <h3 className="h6 fw-semibold mb-1">{title}</h3>
      {message && <p className="text-muted small mb-0">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
