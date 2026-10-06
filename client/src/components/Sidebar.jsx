import { CloseButton } from 'react-bootstrap';
import { BoxArrowRight, Clock } from 'react-bootstrap-icons';
import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { CLINIC_HOURS } from '../utils/constants';
import { getHomePath } from '../utils/redirect';
import Logo from './Logo';

/**
 * White dashboard sidebar: logo, navigation links, clinic hours, logout.
 * Rendered as a fixed column on large screens and inside an Offcanvas on small screens.
 * @param {object} props
 * @param {{ to: string, label: string, icon: React.ElementType, end?: boolean }[]} props.items nav config (see constants.js)
 * @param {() => void} [props.onNavigate] called after a link is clicked (closes the Offcanvas)
 * @param {() => void} [props.onClose] if set, a close (×) button is shown next to the logo
 */
export default function Sidebar({ items, onNavigate, onClose }) {
  const { user, logout } = useAuth();

  return (
    <div className="sc-sidebar-inner">
      <div className="sc-sidebar-brand">
        <Logo to={getHomePath(user)} />
        {onClose && <CloseButton onClick={onClose} aria-label="Close navigation menu" />}
      </div>

      <nav className="sc-sidebar-nav" aria-label="Main navigation">
        <p className="sc-sidebar-section">Menu</p>
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => `sc-nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sc-sidebar-footer">
        <div className="sc-sidebar-hours">
          <Clock aria-hidden="true" />
          <div>
            <div className="fw-semibold small">Clinic hours</div>
            <div className="small text-muted">{CLINIC_HOURS.label}</div>
          </div>
        </div>
        <button type="button" className="sc-nav-link sc-nav-logout" onClick={logout}>
          <BoxArrowRight size={18} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
