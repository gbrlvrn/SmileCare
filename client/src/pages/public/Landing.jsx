import { Button, Col, Container, Row } from 'react-bootstrap';
import {
  ArrowRight,
  Bandaid,
  CalendarCheck,
  ClipboardPulse,
  Clock,
  Gem,
  HeartPulse,
  Magic,
  PersonPlus,
  ShieldCheck,
  ShieldPlus,
  StarFill,
  Stars,
} from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { getDentists } from '../../api/dentistApi';
import { getServices } from '../../api/serviceApi';
import heroImage from '../../assets/hero.jpg';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useFetch from '../../hooks/useFetch';
import {
  formatCurrency,
  formatDuration,
  formatTimeRange,
  formatWorkingDays,
  initials,
} from '../../utils/formatters';

/** Shown when the API is unreachable so the landing page never looks empty. */
const FALLBACK_SERVICES = [
  { _id: 'fallback-1', name: 'Teeth Cleaning', description: 'Professional cleaning that removes plaque and tartar for a fresh, healthy smile.', durationMinutes: 30, price: 1500 },
  { _id: 'fallback-2', name: 'Dental Check-up', description: 'A complete oral exam with personalised advice and a clear treatment plan.', durationMinutes: 30, price: 800 },
  { _id: 'fallback-3', name: 'Tooth Extraction', description: 'Gentle and safe removal of damaged or problematic teeth.', durationMinutes: 60, price: 2500 },
  { _id: 'fallback-4', name: 'Teeth Whitening', description: 'Brighten your smile by several shades in a single comfortable visit.', durationMinutes: 90, price: 8000 },
  { _id: 'fallback-5', name: 'Root Canal Treatment', description: 'Save an infected tooth and relieve pain with modern, precise techniques.', durationMinutes: 120, price: 12000 },
  { _id: 'fallback-6', name: 'Braces Consultation', description: 'Orthodontic assessment and options for straighter, healthier teeth.', durationMinutes: 60, price: 1000 },
];

const FALLBACK_DENTISTS = [
  { _id: 'fallback-d1', fullName: 'Dr. Maria Santos', specialization: 'Orthodontics', workingDays: [1, 2, 3, 4, 5, 6], startTime: '09:00', endTime: '17:00' },
  { _id: 'fallback-d2', fullName: 'Dr. Jose Reyes', specialization: 'General Dentistry', workingDays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '17:00' },
  { _id: 'fallback-d3', fullName: 'Dr. Ana Cruz', specialization: 'Cosmetic Dentistry', workingDays: [2, 4, 6], startTime: '10:00', endTime: '17:00' },
  { _id: 'fallback-d4', fullName: 'Dr. Miguel Garcia', specialization: 'Endodontics', workingDays: [1, 3, 5, 6], startTime: '09:00', endTime: '15:00' },
];

const STATS = [
  { value: '10+', label: 'Years of experience' },
  { value: '4', label: 'Expert dentists' },
  { value: '5k+', label: 'Happy patients' },
  { value: '4.9', label: 'Average patient rating' },
];

const STEPS = [
  { icon: PersonPlus, title: 'Create your account', text: 'Sign up in less than a minute with your name and email.' },
  { icon: CalendarCheck, title: 'Pick a service & time', text: 'Choose a service, your preferred dentist and an open time slot.' },
  { icon: ShieldCheck, title: 'Visit and smile', text: 'We confirm your booking and keep your treatment history in one place.' },
];

/** Picks a fitting icon for a service based on its name. */
function serviceIcon(name = '') {
  const n = name.toLowerCase();
  if (n.includes('clean')) return Stars;
  if (n.includes('whiten')) return Magic;
  if (n.includes('extract')) return Bandaid;
  if (n.includes('root') || n.includes('canal')) return HeartPulse;
  if (n.includes('brace') || n.includes('ortho')) return Gem;
  if (n.includes('check')) return ShieldPlus;
  return ClipboardPulse;
}

/** Section heading used by every landing section. */
function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="sc-section-heading">
      <span className="sc-eyebrow">{eyebrow}</span>
      <h2 className="sc-section-title">{title}</h2>
      {text && <p className="sc-section-text">{text}</p>}
    </div>
  );
}

/** Public home page. */
export default function Landing() {
  useDocumentTitle('');

  const servicesQuery = useFetch(() => getServices(), []);
  const dentistsQuery = useFetch(() => getDentists(), []);

  // Use API data when available, otherwise the static fallback lists.
  const services =
    Array.isArray(servicesQuery.data) && servicesQuery.data.length > 0
      ? servicesQuery.data.slice(0, 6)
      : FALLBACK_SERVICES;
  const dentists =
    Array.isArray(dentistsQuery.data) && dentistsQuery.data.length > 0
      ? dentistsQuery.data.slice(0, 4)
      : FALLBACK_DENTISTS;

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="sc-hero" id="top">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <span className="sc-eyebrow">
                <StarFill aria-hidden="true" className="me-1" /> Trusted family dental care
              </span>
              <h1 className="sc-hero-title">
                A healthier smile starts with care that <span className="text-primary">listens.</span>
              </h1>
              <p className="sc-hero-lead">
                From routine cleanings to complete smile makeovers, our friendly dentists take the
                time to understand you. Book your visit online in under a minute.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Button as={Link} to="/patient/book" size="lg">
                  Book an appointment <ArrowRight aria-hidden="true" className="ms-1" />
                </Button>
                <Button href="#services" size="lg" variant="outline-primary">
                  Explore services
                </Button>
              </div>
              <ul className="sc-hero-meta">
                <li>
                  <Clock aria-hidden="true" /> Mon–Sat, 9:00 AM – 5:00 PM
                </li>
                <li>
                  <ShieldCheck aria-hidden="true" /> Sterilised, modern equipment
                </li>
              </ul>
            </Col>
            <Col lg={6}>
              <div className="sc-hero-media">
                <img
                  src={heroImage}
                  alt="A SmileCare dentist talking with a smiling patient in a bright clinic"
                  width="1000"
                  height="747"
                  fetchPriority="high"
                />
                <div className="sc-hero-float sc-hero-float-top">
                  <StarFill className="text-warning" aria-hidden="true" />
                  <div>
                    <strong>4.9 rating</strong>
                    <span>from 1,200+ reviews</span>
                  </div>
                </div>
                <div className="sc-hero-float sc-hero-float-bottom">
                  <CalendarCheck className="text-primary" aria-hidden="true" />
                  <div>
                    <strong>Same-week visits</strong>
                    <span>Book online anytime</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ---------- Stats strip ---------- */}
      <section className="sc-stats-strip" aria-label="SmileCare in numbers">
        <Container>
          <Row className="g-4 text-center">
            {STATS.map((stat) => (
              <Col xs={6} md={3} key={stat.label}>
                <div className="sc-strip-value">{stat.value}</div>
                <div className="sc-strip-label">{stat.label}</div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ---------- Services ---------- */}
      <section className="sc-section" id="services">
        <Container>
          <SectionHeading
            eyebrow="Our services"
            title="Comprehensive care for every smile"
            text="Preventive, restorative and cosmetic treatments — all under one roof, with transparent pricing."
          />
          <Row xs={1} md={2} lg={3} className="g-4" aria-busy={servicesQuery.loading}>
            {services.map((service) => {
              const Icon = serviceIcon(service.name);
              return (
                <Col key={service._id}>
                  <article className="sc-card sc-service-card h-100">
                    <div className="sc-service-icon" aria-hidden="true">
                      <Icon size={24} />
                    </div>
                    <h3 className="h5 fw-semibold">{service.name}</h3>
                    <p className="text-muted flex-grow-1">{service.description}</p>
                    <div className="sc-service-meta">
                      <span>
                        <Clock aria-hidden="true" /> {formatDuration(service.durationMinutes)}
                      </span>
                      <span className="fw-semibold text-primary">
                        {formatCurrency(service.price)}
                      </span>
                    </div>
                  </article>
                </Col>
              );
            })}
          </Row>
        </Container>
      </section>

      {/* ---------- Dentists ---------- */}
      <section className="sc-section sc-section-tint" id="dentists">
        <Container>
          <SectionHeading
            eyebrow="Our team"
            title="Meet our dentists"
            text="Experienced, gentle and always happy to answer your questions."
          />
          <Row xs={1} sm={2} lg={4} className="g-4" aria-busy={dentistsQuery.loading}>
            {dentists.map((dentist) => {
              const name = dentist.fullName || `Dr. ${dentist.firstName} ${dentist.lastName}`;
              return (
                <Col key={dentist._id}>
                  <article className="sc-card sc-dentist-card h-100">
                    <div className="sc-dentist-avatar" aria-hidden="true">
                      {initials(name)}
                    </div>
                    <h3 className="h6 fw-semibold mb-1">{name}</h3>
                    <p className="text-primary small fw-medium mb-3">{dentist.specialization}</p>
                    <ul className="sc-meta-list justify-content-center">
                      <li>
                        <CalendarCheck aria-hidden="true" />
                        {formatWorkingDays(dentist.workingDays)}
                      </li>
                      <li>
                        <Clock aria-hidden="true" />
                        {formatTimeRange(dentist.startTime, dentist.endTime)}
                      </li>
                    </ul>
                  </article>
                </Col>
              );
            })}
          </Row>
        </Container>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="sc-section" id="how-it-works">
        <Container>
          <SectionHeading
            eyebrow="How it works"
            title="Book your visit in 3 easy steps"
            text="No phone calls, no waiting on hold."
          />
          <Row xs={1} md={3} className="g-4">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <Col key={title}>
                <div className="sc-card sc-step-card h-100">
                  <span className="sc-step-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="sc-service-icon" aria-hidden="true">
                    <Icon size={24} />
                  </div>
                  <h3 className="h5 fw-semibold">
                    <span className="visually-hidden">Step {index + 1}: </span>
                    {title}
                  </h3>
                  <p className="text-muted mb-0">{text}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ---------- CTA banner ---------- */}
      <section className="pb-5">
        <Container>
          <div className="sc-cta-banner">
            <div>
              <h2 className="h3 fw-bold mb-2">Ready for a brighter, healthier smile?</h2>
              <p className="mb-0 opacity-75">
                Book your appointment today — it only takes a minute.
              </p>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <Button as={Link} to="/patient/book" variant="light" size="lg" className="text-primary fw-semibold">
                Book Appointment
              </Button>
              <Button as={Link} to="/register" variant="outline-light" size="lg">
                Create account
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
