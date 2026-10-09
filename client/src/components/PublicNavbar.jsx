import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useAuthModal from '../hooks/useAuthModal';
import { getHomePath } from '../utils/redirect';
import Logo from './Logo';

/** Links to the sections of the landing page (plain anchors scroll to the section id). */
const SECTION_LINKS = [
  { href: '#top', label: 'Home' },
  { href: '#services', label: 'Services' },
  { href: '#dentists', label: 'Dentists' },
  { href: '#how-it-works', label: 'How it works' },
];

/** Sticky top navigation for public pages. Shows "Dashboard" instead of "Login" when signed in. */
export default function PublicNavbar() {
  const { isAuthenticated, user } = useAuth();
  const { openLogin } = useAuthModal();

  return (
    <Navbar expand="lg" sticky="top" collapseOnSelect className="sc-navbar">
      <Container>
        <Navbar.Brand as="div" className="py-0">
          <Logo />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="public-nav" aria-label="Toggle navigation" />
        <Navbar.Collapse id="public-nav">
          <Nav className="mx-auto">
            {SECTION_LINKS.map((link) => (
              <Nav.Link key={link.href} href={link.href}>
                {link.label}
              </Nav.Link>
            ))}
          </Nav>
          <Nav className="align-items-lg-center gap-2">
            {isAuthenticated ? (
              <Button as={Link} to={getHomePath(user)} variant="primary">
                Go to dashboard
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={() => openLogin()}
              >
                Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
