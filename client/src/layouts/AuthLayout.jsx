import { CalendarCheck, CheckCircleFill, ShieldCheck, Stars } from 'react-bootstrap-icons';
import { Link, Outlet } from 'react-router-dom';
import authImage from '../assets/auth.jpg';
import Logo from '../components/Logo';

const BENEFITS = [
  { icon: CalendarCheck, text: 'Book, reschedule or cancel visits online 24/7' },
  { icon: Stars, text: 'See real-time availability of our dentists' },
  { icon: ShieldCheck, text: 'Keep your treatment history safe in one place' },
];

/**
 * Split-screen layout for Login/Register:
 * blue brand panel on the left (stacks on top on mobile), white form panel on the right.
 */
export default function AuthLayout() {
  return (
    <div className="sc-auth sc-auth-enter">
      <section className="sc-auth-panel" aria-label="About SmileCare">
        <Logo variant="light" />

        <div className="sc-auth-panel-body">
          <h2 className="sc-auth-headline">Everything you need for a healthier smile.</h2>
          <p className="sc-auth-lead d-none d-md-block">
            Create your SmileCare account to manage appointments and stay on top of your dental care.
          </p>

          <ul className="sc-auth-benefits d-none d-lg-block">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className="sc-auth-benefit-icon" aria-hidden="true">
                  <Icon />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <div className="sc-auth-image d-none d-lg-block">
            <img src={authImage} alt="Smiling patient in the SmileCare waiting area" loading="lazy" />
            <div className="sc-auth-image-badge">
              <CheckCircleFill aria-hidden="true" />
              <span>Trusted by 5,000+ patients</span>
            </div>
          </div>
        </div>

        <p className="sc-auth-panel-footer d-none d-lg-block">
          <Link to="/">← Back to website</Link>
        </p>
      </section>

      <main className="sc-auth-form-panel" id="main-content">
        <div className="sc-auth-form-wrap">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
