import { useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SignOutConfirmModal from '../components/SignOutConfirmModal';
import Topbar from '../components/Topbar';
import useAuth from '../hooks/useAuth';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useToast from '../hooks/useToast';
import { NAV_BY_ROLE } from '../utils/constants';

/** Finds the nav item that matches the current URL (longest match wins). */
function findActiveItem(items, pathname) {
  return items
    .filter((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))
    .sort((a, b) => b.to.length - a.to.length)[0];
}

/**
 * Layout for patient and staff areas: sidebar + top bar + page content.
 * Below the `lg` breakpoint the sidebar moves into an Offcanvas opened from the top bar.
 */
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { pathname } = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sc_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sc_sidebar_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const items = NAV_BY_ROLE[user?.role] || [];
  const title = findActiveItem(items, pathname)?.label || 'Dashboard';

  // Browser tab title follows the current section.
  useDocumentTitle(title);

  const closeMenu = () => setShowMenu(false);
  const openSignOutModal = () => setShowSignOutModal(true);
  const closeSignOutModal = () => setShowSignOutModal(false);

  const handleConfirmSignOut = () => {
    setShowSignOutModal(false);
    logout();
    showToast({ type: 'info', message: 'You have been signed out successfully.' });
  };

  return (
    <div className={`sc-dashboard${isSidebarCollapsed ? ' sc-dashboard--sidebar-collapsed' : ''}`}>
      <a href="#main-content" className="visually-hidden-focusable sc-skip-link">
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className={`sc-sidebar d-none d-lg-flex${isSidebarCollapsed ? ' sc-sidebar--collapsed' : ''}`}>
        <Sidebar
          items={items}
          onSignOutClick={openSignOutModal}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      </aside>

      {/* Mobile sidebar */}
      <Offcanvas
        show={showMenu}
        onHide={closeMenu}
        placement="start"
        className="sc-sidebar-offcanvas d-lg-none"
        aria-label="Navigation menu"
      >
        <Sidebar
          items={items}
          onNavigate={closeMenu}
          onClose={closeMenu}
          onSignOutClick={() => {
            closeMenu();
            openSignOutModal();
          }}
        />
      </Offcanvas>

      <div className="sc-main">
        <Topbar
          title={title}
          onMenuClick={() => setShowMenu(true)}
        />
        <main className="sc-content" id="main-content">
          <Outlet />
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      <SignOutConfirmModal
        show={showSignOutModal}
        onConfirm={handleConfirmSignOut}
        onCancel={closeSignOutModal}
      />
    </div>
  );
}
