import { List } from 'react-bootstrap-icons';
import { formatDate, todayISO } from '../utils/formatters';
import NotificationDropdown from './NotificationDropdown';

/**
 * Top bar of the dashboard: menu button (mobile), page title, today's date and notifications.
 * @param {object} props
 * @param {string} props.title current section title
 * @param {() => void} props.onMenuClick opens the mobile sidebar
 */
export default function Topbar({ title, onMenuClick }) {
  return (
    <header className="sc-topbar">
      <button
        type="button"
        className="btn sc-icon-btn d-lg-none"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <List size={22} aria-hidden="true" />
      </button>

      <div className="sc-topbar-title flex-grow-1 min-w-0">{title}</div>

      <div className="ms-auto d-flex align-items-center gap-2 gap-md-3 flex-shrink-0">
        <span className="sc-topbar-date d-none d-md-inline flex-shrink-0">
          {formatDate(todayISO(), { weekday: 'short' })}
        </span>

        <NotificationDropdown />
      </div>
    </header>
  );
}
