import { CloseButton, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BoxArrowRight, ChevronLeft, Clock } from 'react-bootstrap-icons';
import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { CLINIC_HOURS } from '../utils/constants';
import { getHomePath } from '../utils/redirect';
import Logo from './Logo';

/**
 * Modern clinical dashboard sidebar:
 * - Brand header with logo & smooth toggle button
 * - Refined navigation links with active indicators and icon scaling
 * - Status-aware clinic hours card
 * - Polished ghost sign-out action
 *
 * All DOM nodes remain mounted for buttery-smooth CSS collapse/expand transitions.
 *
 * @param {object} props
 * @param {{ to: string, label: string, icon: React.ElementType, end?: boolean }[]} props.items nav config
 * @param {() => void} [props.onNavigate] called after a link is clicked
 * @param {() => void} [props.onClose] if set, close button is shown (mobile drawer)
 * @param {() => void} [props.onSignOutClick] callback to open sign out modal
 * @param {boolean} [props.isCollapsed=false] whether sidebar is collapsed
 * @param {() => void} [props.onToggleCollapse] toggle collapse state
 */
export default function Sidebar({
  items,
  onNavigate,
  onClose,
  onSignOutClick,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const { user, logout } = useAuth();
  const handleSignOut = onSignOutClick || logout;

  return (
    <div className={`sc-sidebar-inner ${isCollapsed ? 'is-collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sc-sidebar-brand">
        <div className="sc-sidebar-brand-logo">
          <Logo to={getHomePath(user)} collapsed={isCollapsed} size={isCollapsed ? 'sm' : 'md'} />
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            className="sc-sidebar-toggle-btn d-none d-lg-inline-flex"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleCollapse();
            }}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
          >
            <ChevronLeft
              size={14}
              className={`sc-sidebar-toggle-icon ${isCollapsed ? 'is-rotated' : ''}`}
              aria-hidden="true"
            />
          </button>
        )}
        {onClose && <CloseButton onClick={onClose} aria-label="Close navigation menu" />}
      </div>

      {/* Navigation */}
      <nav className="sc-sidebar-nav" aria-label="Main navigation">
        <p className="sc-sidebar-section">Navigation</p>

        {items.map(({ to, label, icon: Icon, end }) => (
          <OverlayTrigger
            key={to}
            placement="right"
            delay={{ show: 250, hide: 50 }}
            trigger={isCollapsed ? ['hover'] : []}
            overlay={<Tooltip id={`sidebar-tt-${to.replace(/[^a-zA-Z0-9]/g, '-')}`}>{label}</Tooltip>}
          >
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) => `sc-nav-link${isActive ? ' active' : ''}`}
              aria-label={isCollapsed ? label : undefined}
            >
              <span className="sc-nav-icon-wrap" aria-hidden="true">
                <Icon size={18} />
              </span>
              <span className="sc-nav-text">{label}</span>
            </NavLink>
          </OverlayTrigger>
        ))}
      </nav>

      {/* Footer Widgets */}
      <div className="sc-sidebar-footer">
        {/* Clinic Hours Card */}
        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 50 }}
          trigger={isCollapsed ? ['hover'] : []}
          overlay={
            <Tooltip id="sidebar-hours-tt">
              <div className="fw-semibold">Clinic hours</div>
              <div className="small">{CLINIC_HOURS.label}</div>
            </Tooltip>
          }
        >
          <div
            className="sc-sidebar-hours"
            tabIndex={isCollapsed ? 0 : undefined}
            role={isCollapsed ? 'button' : undefined}
            aria-label={isCollapsed ? `Clinic hours: ${CLINIC_HOURS.label}` : undefined}
          >
            <div className="sc-sidebar-hours-icon" aria-hidden="true">
              <Clock size={15} />
            </div>
            <div className="sc-sidebar-hours-content">
              <div className="d-flex align-items-center gap-1">
                <span className="sc-status-dot" aria-hidden="true" />
                <span className="sc-sidebar-hours-title">Clinic Hours</span>
              </div>
              <div className="sc-sidebar-hours-time">{CLINIC_HOURS.label}</div>
            </div>
          </div>
        </OverlayTrigger>

        {/* Sign Out Button */}
        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 50 }}
          trigger={isCollapsed ? ['hover'] : []}
          overlay={<Tooltip id="sidebar-signout-tt">Sign Out</Tooltip>}
        >
          <button
            type="button"
            className="sc-nav-link sc-nav-logout"
            onClick={handleSignOut}
            aria-label={isCollapsed ? 'Sign Out' : undefined}
          >
            <span className="sc-nav-icon-wrap" aria-hidden="true">
              <BoxArrowRight size={18} />
            </span>
            <span className="sc-nav-text">Sign Out</span>
          </button>
        </OverlayTrigger>
      </div>
    </div>
  );
}
