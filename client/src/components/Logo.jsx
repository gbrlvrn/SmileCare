import { Link } from 'react-router-dom';
import mascotImg from '../assets/logo-mascot-transparent.png';

/** Tooth mascot icon used across the application. */
export function ToothIcon({ size = 20, className = '', ...props }) {
  return (
    <img
      src={mascotImg}
      alt="SmileCare mascot"
      width={size}
      height={size}
      className={`sc-logo-mascot-img ${className}`.trim()}
      style={{ objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * SmileCare logo: cute mascot badge + wordmark.
 *
 * @param {object} props
 * @param {'dark'|'light'} [props.variant='dark'] 'light' = white text for dark/blue backgrounds
 * @param {string|null} [props.to='/'] link target; pass null to render without a link
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string} [props.className]
 * @param {boolean} [props.collapsed=false]
 */
export default function Logo({
  variant = 'dark',
  to = '/',
  size = 'md',
  className = '',
  collapsed = false,
}) {
  const mascotSize = size === 'lg' ? 36 : size === 'sm' ? 22 : 28;

  const content = (
    <>
      <span className="sc-logo-badge" aria-hidden="true">
        <ToothIcon size={mascotSize} />
      </span>
      <span className="sc-logo-text">
        Smile<span className="sc-logo-accent">Care</span>
      </span>
    </>
  );
  const classes = `sc-logo sc-logo-${variant} sc-logo-${size} ${collapsed ? 'sc-logo-collapsed' : ''} ${className}`.trim();

  if (!to) return <span className={classes}>{content}</span>;
  return (
    <Link to={to} className={classes} aria-label="SmileCare home">
      {content}
    </Link>
  );
}
