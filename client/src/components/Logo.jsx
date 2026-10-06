import { Link } from 'react-router-dom';

/** Tooth icon used by the logo (inline SVG so it can take the current colour). */
export function ToothIcon({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} viewBox="11 12 42 42" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22.5 14c-5.8 0-9.5 4.6-9.5 10.6 0 4.3 1.6 7.4 2.9 10.6 1.4 3.5 2 7.6 2.7 11.6.5 3 1.6 5.2 3.6 5.2 2.4 0 3-2.6 3.6-6 .7-3.8 1.8-7.5 6.2-7.5s5.5 3.7 6.2 7.5c.6 3.4 1.2 6 3.6 6 2 0 3.1-2.2 3.6-5.2.7-4 1.3-8.1 2.7-11.6 1.3-3.2 2.9-6.3 2.9-10.6 0-6-3.7-10.6-9.5-10.6-4.2 0-6.3 2.2-9.5 2.2S26.7 14 22.5 14z" />
    </svg>
  );
}

/**
 * SmileCare logo: blue tooth badge + wordmark.
 * @param {object} props
 * @param {'dark'|'light'} [props.variant='dark'] 'light' = white text for blue backgrounds
 * @param {string|null} [props.to='/'] link target; pass null to render without a link
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string} [props.className]
 */
export default function Logo({ variant = 'dark', to = '/', size = 'md', className = '' }) {
  const content = (
    <>
      <span className="sc-logo-badge" aria-hidden="true">
        <ToothIcon size={size === 'lg' ? 22 : size === 'sm' ? 14 : 18} />
      </span>
      <span className="sc-logo-text">
        Smile<span className="sc-logo-accent">Care</span>
      </span>
    </>
  );
  const classes = `sc-logo sc-logo-${variant} sc-logo-${size} ${className}`.trim();

  if (!to) return <span className={classes}>{content}</span>;
  return (
    <Link to={to} className={classes} aria-label="SmileCare home">
      {content}
    </Link>
  );
}
