import { Outlet } from 'react-router-dom';
import PublicFooter from '../components/PublicFooter';
import PublicNavbar from '../components/PublicNavbar';

/** Layout for public marketing pages: sticky navbar + page + footer. */
export default function PublicLayout() {
  return (
    <div className="sc-public">
      <a href="#main-content" className="visually-hidden-focusable sc-skip-link">
        Skip to main content
      </a>
      <PublicNavbar />
      <main id="main-content">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
