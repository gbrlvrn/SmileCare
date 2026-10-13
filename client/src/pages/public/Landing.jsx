import { useEffect, useRef, useState } from 'react';
import { Button, Col, Container, Modal, Row } from 'react-bootstrap';
import {
  ArrowCounterclockwise,
  ArrowRight,
  Bandaid,
  CalendarCheck,
  CheckCircleFill,
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
  XLg,
} from 'react-bootstrap-icons';
import { Link, useNavigate } from 'react-router-dom';
import { getDentists } from '../../api/dentistApi';
import { getServices } from '../../api/serviceApi';
import heroImage from '../../assets/hero.jpg';
import heroImage2 from '../../assets/auth.jpg';
import heroImage3 from '../../assets/dental-banner-bg.jpg';
import useAuth from '../../hooks/useAuth';
import useAuthModal from '../../hooks/useAuthModal';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useFetch from '../../hooks/useFetch';
import {
  formatCurrency,
  formatDuration,
  formatTimeRange,
  formatWorkingDays,
  initials,
} from '../../utils/formatters';
import { getDentistPortrait } from '../../utils/dentistImages';

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

const HERO_SLIDES = [
  { src: heroImage, alt: 'A SmileCare dentist talking with a smiling patient in a bright clinic' },
  { src: heroImage2, alt: 'A friendly SmileCare team member welcoming patients at the front desk' },
  { src: heroImage3, alt: 'The modern, spotless SmileCare treatment room' },
];

const STATS = [
  { target: 10, suffix: '+', value: '10+', label: 'Years of experience' },
  { target: 4, suffix: '', value: '4', label: 'Expert dentists' },
  { target: 5, suffix: 'k+', value: '5k+', label: 'Happy patients' },
  { target: 4.9, suffix: '', decimals: 1, value: '4.9', label: 'Average patient rating' },
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

/** The signature royal blue styling from the Root Canal Treatment card, shared across all cards. */
const ROOT_CANAL_CARD_THEME = {
  accentColor: '#2563eb',
  accentLight: '#60a5fa',
  gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  bgGradient: 'linear-gradient(160deg, #ffffff 0%, #eff6ff 45%, #dbeafe 100%)',
  borderColor: '#bfdbfe',
  iconShadow: '0 8px 20px rgba(37, 99, 235, 0.28)',
  badgeBg: '#dbeafe',
  badgeBorder: '#93c5fd',
  priceBg: '#dbeafe',
};

const SERVICE_THEMES = [
  {
    id: 'cleaning',
    category: 'Preventive Care',
    highlight: 'Removes plaque & tartar for lasting freshness',
    ...ROOT_CANAL_CARD_THEME,
  },
  {
    id: 'checkup',
    category: 'Oral Health',
    highlight: 'Comprehensive clinical oral examination',
    ...ROOT_CANAL_CARD_THEME,
  },
  {
    id: 'extraction',
    category: 'Gentle Care',
    highlight: 'Safe, pain-managed tooth extraction',
    ...ROOT_CANAL_CARD_THEME,
  },
  {
    id: 'whitening',
    category: 'Cosmetic',
    highlight: 'Brighter, radiant smile in one session',
    ...ROOT_CANAL_CARD_THEME,
  },
  {
    id: 'rootcanal',
    category: 'Restorative',
    highlight: 'Specialized therapy to save infected teeth',
    ...ROOT_CANAL_CARD_THEME,
  },
  {
    id: 'braces',
    category: 'Orthodontics',
    highlight: 'Tailored consultation for straighter teeth',
    ...ROOT_CANAL_CARD_THEME,
  },
];

function getServiceTheme(service = {}, index = 0) {
  const n = (service.name || '').toLowerCase();
  let matchedIndex = index;
  if (n.includes('clean')) matchedIndex = 0;
  else if (n.includes('check') || n.includes('exam')) matchedIndex = 1;
  else if (n.includes('extract')) matchedIndex = 2;
  else if (n.includes('whiten')) matchedIndex = 3;
  else if (n.includes('root') || n.includes('canal')) matchedIndex = 4;
  else if (n.includes('brace') || n.includes('ortho')) matchedIndex = 5;
  else {
    return {
      category: 'Dental Service',
      highlight: 'Professional clinic care tailored for you',
      ...ROOT_CANAL_CARD_THEME,
    };
  }

  return SERVICE_THEMES[matchedIndex];
}

/** Returns a detailed professional background bio for the dentist modal. */
function getDentistBio(dentist) {
  if (dentist?.bio && dentist.bio.trim()) {
    return dentist.bio.trim();
  }
  const spec = (dentist?.specialization || '').toLowerCase();
  const name = dentist?.fullName || `Dr. ${dentist?.firstName || ''} ${dentist?.lastName || ''}`.trim() || 'Our dentist';

  if (spec.includes('ortho')) {
    return `${name} specializes in orthodontic treatments, including modern clear aligners and traditional braces. Dedicated to guiding patients of all ages toward aligned, confident smiles with gentle and personalized care plans.`;
  }
  if (spec.includes('general')) {
    return `${name} provides comprehensive family dental care, oral wellness examinations, and preventive treatments. Known for a friendly chairside manner and patient-first treatment philosophy.`;
  }
  if (spec.includes('cosmetic')) {
    return `${name} focuses on aesthetic smile makeovers, clinical teeth whitening, and composite restorations. Committed to helping patients achieve bright, radiant smiles that enhance confidence.`;
  }
  if (spec.includes('endo') || spec.includes('root')) {
    return `${name} is an expert in restorative dentistry and advanced root canal therapy. Utilizing modern techniques to relieve discomfort and successfully preserve natural teeth.`;
  }
  return `${name} is a licensed and experienced dental professional at SmileCare, dedicated to providing high-quality, comfortable dental care tailored to your unique oral health needs.`;
}

/** Section heading used by every landing section. */
function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="sc-section-heading sc-reveal">
      <span className="sc-eyebrow">{eyebrow}</span>
      <h2 className="sc-section-title">{title}</h2>
      {text && <p className="sc-section-text">{text}</p>}
    </div>
  );
}

/**
 * Smooth number count-up animation component.
 * Uses requestAnimationFrame with an easeOutCubic curve.
 */
function StatCounter({ target, suffix = '', decimals = 0, duration = 1800, start = false }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      setCount(target);
      return;
    }

    let startTimestamp = null;
    let frameId;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = easeOutCubic(progress) * target;

      setCount(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [start, target, duration]);

  const display = decimals > 0 ? count.toFixed(decimals) : Math.floor(count);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

/** Public home page. */
export default function Landing() {
  useDocumentTitle('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openLogin, openRegister } = useAuthModal();

  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((i) => (i + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const [flippedCards, setFlippedCards] = useState({});
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsStripRef = useRef(null);

  useEffect(() => {
    const el = statsStripRef.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setStatsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.2,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleCardFlip = (id) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleBookService = (serviceId) => {
    const target = `/patient/book?service=${serviceId}`;
    if (isAuthenticated) {
      navigate(target);
    } else {
      openLogin({ redirectPath: target });
    }
  };

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

  useEffect(() => {
    const elements = document.querySelectorAll('.sc-reveal');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('sc-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sc-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [services, dentists]);

  return (
    <div className="sc-landing-enter">
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
                {isAuthenticated ? (
                  <Button as={Link} to="/patient/book" size="lg">
                    Book an appointment <ArrowRight aria-hidden="true" className="ms-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => openLogin({ redirectPath: '/patient/book' })}
                  >
                    Book an appointment <ArrowRight aria-hidden="true" className="ms-1" />
                  </Button>
                )}
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
                <div className="sc-hero-slides">
                  {HERO_SLIDES.map((slide, i) => (
                    <img
                      key={slide.src}
                      src={slide.src}
                      alt={slide.alt}
                      className={i === heroSlide ? 'is-active' : ''}
                      aria-hidden={i === heroSlide ? undefined : 'true'}
                      width="1000"
                      height="747"
                      fetchPriority={i === 0 ? 'high' : undefined}
                    />
                  ))}
                </div>
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
      <section
        ref={statsStripRef}
        className="sc-stats-strip sc-reveal"
        aria-label="SmileCare in numbers"
      >
        <Container>
          <Row className="g-4 text-center">
            {STATS.map((stat) => (
              <Col xs={6} md={3} key={stat.label}>
                <div
                  className="sc-strip-value"
                  aria-label={`${stat.value} ${stat.label}`}
                >
                  <StatCounter
                    target={stat.target}
                    suffix={stat.suffix}
                    decimals={stat.decimals || 0}
                    start={statsVisible}
                  />
                </div>
                <div className="sc-strip-label">{stat.label}</div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ---------- Services ---------- */}
      <section className="sc-section sc-services-section" id="services">
        <Container>
          <SectionHeading
            eyebrow="Our services"
            title="Comprehensive care for every smile"
            text="Preventive, restorative and cosmetic treatments — all under one roof, with transparent pricing."
          />
          <Row xs={1} md={2} lg={3} className="g-4" aria-busy={servicesQuery.loading}>
            {services.map((service, index) => {
              const Icon = serviceIcon(service.name);
              const theme = getServiceTheme(service, index);
              const isFlipped = Boolean(flippedCards[service._id]);

              return (
                <Col key={service._id} className={`sc-reveal sc-reveal-delay-${(index % 3) + 1} d-flex`}>
                  <div
                    className={`sc-flip-card w-100 ${isFlipped ? 'is-flipped' : ''}`}
                    onClick={() => toggleCardFlip(service._id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleCardFlip(service._id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${service.name}, flip to ${isFlipped ? 'hide' : 'view'} details`}
                  >
                    <div className="sc-flip-card-inner">
                      {/* FRONT OF CARD */}
                      <article
                        className="sc-flip-card-front"
                        style={{
                          background: theme.bgGradient,
                          borderColor: theme.borderColor,
                        }}
                      >
                        <div
                          className="sc-service-top-stripe"
                          style={{ background: theme.gradient }}
                        />

                        <div className="d-flex align-items-center justify-content-between mb-2 pt-1">
                          <div
                            className="sc-service-icon-wrap"
                            style={{
                              background: theme.gradient,
                              boxShadow: theme.iconShadow,
                            }}
                            aria-hidden="true"
                          >
                            <Icon size={24} />
                          </div>
                          <span
                            className="sc-service-badge"
                            style={{
                              color: theme.accentColor,
                              backgroundColor: theme.badgeBg,
                              borderColor: theme.badgeBorder,
                            }}
                          >
                            {theme.category}
                          </span>
                        </div>

                        <h3 className="sc-service-title mb-1">{service.name}</h3>

                        <div className="sc-service-features mb-2">
                          <div className="sc-service-feature-item">
                            <CheckCircleFill
                              size={14}
                              style={{ color: theme.accentColor }}
                              aria-hidden="true"
                            />
                            <span>{theme.highlight}</span>
                          </div>
                        </div>

                        <div className="sc-service-meta-highlight">
                          <div className="sc-meta-chip">
                            <Clock size={14} aria-hidden="true" />
                            <span>{formatDuration(service.durationMinutes)}</span>
                          </div>
                          <span
                            className="sc-price-chip"
                            style={{
                              color: theme.accentColor,
                              backgroundColor: theme.priceBg,
                            }}
                          >
                            {formatCurrency(service.price)}
                          </span>
                        </div>
                      </article>

                      {/* BACK OF CARD */}
                      <article className="sc-flip-card-back">
                        <div
                          className="sc-service-top-stripe"
                          style={{ background: theme.gradient }}
                        />

                        <div className="sc-back-header">
                          <div className="d-flex align-items-center gap-2 pt-1">
                            <div
                              className="sc-back-mini-icon"
                              style={{ background: theme.gradient }}
                              aria-hidden="true"
                            >
                              <Icon size={16} />
                            </div>
                            <div>
                              <div
                                className="sc-back-eyebrow"
                                style={{ color: theme.accentLight }}
                              >
                                {theme.category}
                              </div>
                              <h4 className="sc-back-title text-white mb-0">
                                {service.name}
                              </h4>
                            </div>
                          </div>
                        </div>

                        <div className="sc-back-body">
                          <p className="sc-back-description">
                            {service.description}
                          </p>
                          <div className="sc-back-info-grid">
                            <div className="sc-back-info-item">
                              <Clock size={13} className="text-info" />
                              <span className="text-white-50 small">Duration:</span>
                              <strong className="text-white">
                                {formatDuration(service.durationMinutes)}
                              </strong>
                            </div>
                            <div className="sc-back-info-item">
                              <span className="text-white-50 small">Fee:</span>
                              <strong
                                className="sc-back-price-tag"
                                style={{ color: theme.accentLight }}
                              >
                                {formatCurrency(service.price)}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="sc-back-footer">
                          <Button
                            size="sm"
                            className="sc-back-book-btn w-100 text-white"
                            style={{
                              background: theme.gradient,
                              border: 'none',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookService(service._id);
                            }}
                          >
                            Book This Service{' '}
                            <ArrowRight aria-hidden="true" className="ms-1" />
                          </Button>
                          <button
                            type="button"
                            className="sc-back-flip-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCardFlip(service._id);
                            }}
                          >
                            <ArrowCounterclockwise
                              aria-hidden="true"
                              className="me-1"
                            />
                            Turn back to overview
                          </button>
                        </div>
                      </article>
                    </div>
                  </div>
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
            {dentists.map((dentist, index) => {
              const name = dentist.fullName || `Dr. ${dentist.firstName} ${dentist.lastName}`;
              return (
                <Col key={dentist._id} className={`sc-reveal sc-reveal-delay-${(index % 4) + 1}`}>
                  <article
                    className="sc-card sc-dentist-card h-100"
                    onClick={() => setSelectedDentist(dentist)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedDentist(dentist);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View profile and consultation hours for ${name}`}
                  >
                    <img
                      src={getDentistPortrait(dentist)}
                      alt={name}
                      className="sc-dentist-avatar object-fit-cover shadow-sm p-0"
                    />
                    <h3 className="h6 fw-semibold mb-1">{name}</h3>
                    <p className="text-primary small fw-medium mb-3">{dentist.specialization}</p>
                    <ul className="sc-meta-list justify-content-center mb-3">
                      <li>
                        <CalendarCheck aria-hidden="true" />
                        {formatWorkingDays(dentist.workingDays)}
                      </li>
                      <li>
                        <Clock aria-hidden="true" />
                        {formatTimeRange(dentist.startTime, dentist.endTime)}
                      </li>
                    </ul>
                    <div className="sc-dentist-card-cta">
                      <span>View details</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </div>
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
              <Col key={title} className={`sc-reveal sc-reveal-delay-${index + 1}`}>
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
          <div className="sc-cta-banner sc-reveal">
            <div>
              <h2 className="h3 fw-bold mb-2 text-white">Ready for a brighter, healthier smile?</h2>
              <p className="mb-0 text-white opacity-90">
                Book your appointment today — it only takes a minute.
              </p>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {isAuthenticated ? (
                <Button as={Link} to="/patient/book" variant="light" size="lg" className="text-primary fw-semibold">
                  Book Appointment
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="light"
                    size="lg"
                    className="text-primary fw-semibold"
                    onClick={() => openLogin({ redirectPath: '/patient/book' })}
                  >
                    Book Appointment
                  </Button>
                  <Button
                    type="button"
                    variant="outline-light"
                    size="lg"
                    onClick={() => openRegister()}
                  >
                    Create account
                  </Button>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ---------- Dentist Information Modal ---------- */}
      <Modal
        show={Boolean(selectedDentist)}
        onHide={() => setSelectedDentist(null)}
        centered
        className="sc-dentist-modal"
        aria-labelledby="dentist-modal-title"
      >
        {selectedDentist && (() => {
          const dentistName = selectedDentist.fullName || `Dr. ${selectedDentist.firstName} ${selectedDentist.lastName}`;
          const portrait = getDentistPortrait(selectedDentist);
          const bio = getDentistBio(selectedDentist);

          return (
            <div className="sc-dentist-modal-card">
              <button
                type="button"
                className="sc-dentist-modal-close-btn"
                onClick={() => setSelectedDentist(null)}
                aria-label="Close"
              >
                <XLg size={13} aria-hidden="true" />
              </button>

              <div className="text-center pt-1 mb-3">
                <img
                  src={portrait}
                  alt={dentistName}
                  className="sc-dentist-modal-avatar"
                />
                <h3 id="dentist-modal-title" className="h5 fw-bold text-dark mb-1">
                  {dentistName}
                </h3>
                <p className="text-primary small fw-semibold mb-0">
                  {selectedDentist.specialization}
                </p>
              </div>

              {bio && (
                <p className="text-muted small text-center mb-3 lh-base px-2">
                  {bio}
                </p>
              )}

              <div className="sc-dentist-schedule-card mb-3">
                <div className="sc-dentist-schedule-row">
                  <span className="sc-dentist-schedule-label">
                    <CalendarCheck className="text-primary flex-shrink-0" size={15} />
                    <span>Working Days</span>
                  </span>
                  <span className="sc-dentist-schedule-value">{formatWorkingDays(selectedDentist.workingDays)}</span>
                </div>
                <div className="sc-dentist-schedule-row">
                  <span className="sc-dentist-schedule-label">
                    <Clock className="text-primary flex-shrink-0" size={15} />
                    <span>Clinic Hours</span>
                  </span>
                  <span className="sc-dentist-schedule-value">{formatTimeRange(selectedDentist.startTime, selectedDentist.endTime)}</span>
                </div>
              </div>

              <Button
                className="w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 py-2"
                onClick={() => {
                  const id = selectedDentist._id;
                  setSelectedDentist(null);
                  const target = `/patient/book?dentist=${id}`;
                  if (isAuthenticated) {
                    navigate(target);
                  } else {
                    openLogin({ redirectPath: target });
                  }
                }}
              >
                Book Appointment
                <ArrowRight size={15} />
              </Button>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
