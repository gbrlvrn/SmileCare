import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Logo, { ToothIcon } from '../../components/Logo';
import useAuth from '../../hooks/useAuth';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getHomePath } from '../../utils/redirect';

/** 404 page for unknown URLs. */
export default function NotFound() {
  useDocumentTitle('Page not found');
  const { isAuthenticated, user } = useAuth();

  return (
    <main className="sc-not-found" id="main-content">
      <Logo />
      <div className="sc-not-found-body">
        <div className="sc-not-found-icon" aria-hidden="true">
          <ToothIcon size={44} />
        </div>
        <p className="sc-not-found-code">404</p>
        <h1 className="h3 fw-bold">We couldn’t find that page</h1>
        <p className="text-muted mb-4">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>
        <div className="d-flex flex-wrap justify-content-center gap-2">
          <Button as={Link} to="/" variant="outline-primary">
            Back to home
          </Button>
          {isAuthenticated && (
            <Button as={Link} to={getHomePath(user)}>
              Go to dashboard
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
