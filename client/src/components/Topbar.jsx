import { Dropdown } from 'react-bootstrap';
import { BoxArrowRight, List, PersonCircle } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ROLE_LABELS } from '../utils/constants';
import { formatDate, fullName, initials, todayISO } from '../utils/formatters';
import { getHomePath } from '../utils/redirect';

/**
 * Top bar of the dashboard: menu button (mobile), page title, today's date and user menu.
 * @param {object} props
 * @param {string} props.title current section title
 * @param {() => void} props.onMenuClick opens the mobile sidebar
 */
export default function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const name = fullName(user);

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

      <div className="sc-topbar-title">{title}</div>

      <div className="ms-auto d-flex align-items-center gap-3">
        <span className="sc-topbar-date d-none d-md-inline">
          {formatDate(todayISO(), { weekday: 'short' })}
        </span>

        <Dropdown align="end">
          <Dropdown.Toggle as="button" type="button" className="sc-user-toggle" id="user-menu-toggle">
            <span className="sc-avatar" aria-hidden="true">
              {initials(name)}
            </span>
            <span className="d-none d-sm-flex flex-column text-start lh-sm">
              <span className="fw-semibold small text-truncate sc-user-name">{name}</span>
              <span className="text-muted sc-user-role">{ROLE_LABELS[user?.role]}</span>
            </span>
            <span className="visually-hidden">Open user menu</span>
          </Dropdown.Toggle>

          <Dropdown.Menu className="sc-dropdown-menu shadow-sm">
            <Dropdown.Header>
              <div className="fw-semibold text-body">{name}</div>
              <div className="small text-truncate">{user?.email}</div>
            </Dropdown.Header>
            <Dropdown.Divider />
            <Dropdown.Item as={Link} to={`${getHomePath(user)}/profile`}>
              <PersonCircle className="me-2" aria-hidden="true" />
              Profile
            </Dropdown.Item>
            <Dropdown.Item as="button" onClick={logout} className="text-danger">
              <BoxArrowRight className="me-2" aria-hidden="true" />
              Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
}
