import { ArrowLeft } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';

/**
 * Title row at the top of every dashboard page.
 * @param {object} props
 * @param {string} props.title
 * @param {React.ReactNode} [props.subtitle]
 * @param {React.ReactNode} [props.actions] buttons shown on the right (stack under the title on mobile)
 * @param {string} [props.backTo] optional link shown above the title (e.g. '/staff/appointments')
 * @param {string} [props.backLabel='Back']
 */
export default function PageHeader({ title, subtitle, actions, backTo, backLabel = 'Back' }) {
  return (
    <div className="sc-page-header">
      <div>
        {backTo && (
          <Link to={backTo} className="sc-back-link">
            <ArrowLeft aria-hidden="true" className="me-1" />
            {backLabel}
          </Link>
        )}
        <h1 className="sc-page-title">{title}</h1>
        {subtitle && <p className="sc-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="sc-page-actions">{actions}</div>}
    </div>
  );
}
