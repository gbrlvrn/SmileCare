import { MoonStarsFill, SunFill } from 'react-bootstrap-icons';
import useTheme from '../hooks/useTheme';

/**
 * Round sun/moon button that toggles light / dark mode.
 * The icons cross-rotate on switch; the page itself animates via the ThemeProvider.
 *
 * @param {object} props
 * @param {string} [props.className]
 * @param {string} [props.id]
 */
export default function ThemeToggle({ className = '', id }) {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      id={id}
      className={`sc-theme-toggle${isDark ? ' is-dark' : ''} ${className}`.trim()}
      onClick={(e) => {
        toggleTheme(e);
        e.currentTarget.blur();
      }}
      aria-label={label}
      title={label}
    >
      <span className="sc-theme-toggle-icon sc-theme-toggle-sun" aria-hidden="true">
        <SunFill size={16} />
      </span>
      <span className="sc-theme-toggle-icon sc-theme-toggle-moon" aria-hidden="true">
        <MoonStarsFill size={15} />
      </span>
    </button>
  );
}
