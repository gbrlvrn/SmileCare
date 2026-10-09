import { Col, Container, Row } from 'react-bootstrap';
import { Clock, Envelope, GeoAlt, Telephone } from 'react-bootstrap-icons';
import useAuthModal from '../hooks/useAuthModal';
import { CLINIC_INFO } from '../utils/constants';
import Logo from './Logo';

// Computed once when the module loads (keeps the component render pure).
const YEAR = new Date().getFullYear();

/** Footer for public pages: about, quick links, clinic hours and contact details. */
export default function PublicFooter() {
  const year = YEAR;
  const { openLogin, openRegister } = useAuthModal();

  return (
    <footer className="sc-footer">
      <Container>
        <Row className="g-4">
          <Col lg={4}>
            <Logo variant="light" />
            <p className="mt-3 mb-0 sc-footer-muted">
              Gentle, modern dental care for the whole family. Book your visit online in minutes.
            </p>
          </Col>

          <Col sm={6} lg={2}>
            <h2 className="sc-footer-title">Quick links</h2>
            <ul className="list-unstyled sc-footer-links">
              <li><a href="#services">Services</a></li>
              <li><a href="#dentists">Our dentists</a></li>
              <li><a href="#how-it-works">How it works</a></li>
              <li>
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none sc-footer-action-link text-start"
                  onClick={() => openLogin()}
                >
                  Patient login
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none sc-footer-action-link text-start"
                  onClick={() => openRegister()}
                >
                  Create account
                </button>
              </li>
            </ul>
          </Col>

          <Col sm={6} lg={3}>
            <h2 className="sc-footer-title">Clinic hours</h2>
            <ul className="list-unstyled sc-footer-list">
              <li>
                <Clock aria-hidden="true" />
                <span>
                  Monday – Saturday
                  <br />
                  9:00 AM – 5:00 PM
                </span>
              </li>
              <li>
                <Clock aria-hidden="true" />
                <span>Sunday: Closed</span>
              </li>
            </ul>
          </Col>

          <Col lg={3}>
            <h2 className="sc-footer-title">Contact us</h2>
            <ul className="list-unstyled sc-footer-list">
              <li>
                <GeoAlt aria-hidden="true" />
                <span>{CLINIC_INFO.address}</span>
              </li>
              <li>
                <Telephone aria-hidden="true" />
                <span>
                  {CLINIC_INFO.phone} · {CLINIC_INFO.mobile}
                </span>
              </li>
              <li>
                <Envelope aria-hidden="true" />
                <a href={`mailto:${CLINIC_INFO.email}`}>{CLINIC_INFO.email}</a>
              </li>
            </ul>
          </Col>
        </Row>

        <div className="sc-footer-bottom">
          <span>© {year} SmileCare Dental Clinic. All rights reserved.</span>
          <span>Caring for smiles in Metro Manila.</span>
        </div>
      </Container>
    </footer>
  );
}
