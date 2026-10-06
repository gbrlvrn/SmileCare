import { useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import useAuth from '../hooks/useAuth';
import useDocumentTitle from '../hooks/useDocumentTitle';
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
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const items = NAV_BY_ROLE[user?.role] || [];
  const title = findActiveItem(items, pathname)?.label || 'Dashboard';

  // Browser tab title follows the current section.
  useDocumentTitle(title);

  const closeMenu = () => setShowMenu(false);

  return (
    <div className="sc-dashboard">
      <a href="#main-content" className="visually-hidden-focusable sc-skip-link">
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="sc-sidebar d-none d-lg-flex">
        <Sidebar items={items} />
      </aside>

      {/* Mobile sidebar */}
      <Offcanvas
        show={showMenu}
        onHide={closeMenu}
        placement="start"
        className="sc-sidebar-offcanvas d-lg-none"
        aria-label="Navigation menu"
      >
        <Sidebar items={items} onNavigate={closeMenu} onClose={closeMenu} />
      </Offcanvas>

      <div className="sc-main">
        <Topbar title={title} onMenuClick={() => setShowMenu(true)} />
        <main className="sc-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
