import { useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { ThemeContext } from './contexts';

const STORAGE_KEY = 'sc_color_scheme';
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function systemScheme() {
  return darkQuery().matches ? 'dark' : 'light';
}

/** Writes the scheme to <html> so both our CSS and Bootstrap 5.3 pick it up. */
function applyToDocument(scheme, stored) {
  const root = document.documentElement;
  root.setAttribute('data-theme', scheme);
  root.setAttribute('data-bs-theme', scheme);
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.content = stored ?? 'light dark';
}

/**
 * Light / dark theme provider.
 *
 * Two-state toggle following the system preference by default:
 * - no stored value → follow the OS (and live-update when it changes)
 * - stored "light" / "dark" → explicit override
 * Toggling back to the system's scheme clears the override.
 *
 * The switch animates with a circular View Transition reveal from the clicked
 * button; browsers without View Transitions (or users preferring reduced motion)
 * get a short colour cross-fade instead.
 */
export function ThemeProvider({ children }) {
  const [stored, setStored] = useState(readStored);
  const [system, setSystem] = useState(systemScheme);
  const theme = stored ?? system;

  useEffect(() => {
    applyToDocument(theme, stored);
  }, [theme, stored]);

  // Follow OS changes while there is no explicit override.
  useEffect(() => {
    const mq = darkQuery();
    const onChange = (e) => setSystem(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setStored(readStored());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const commit = useCallback((target) => {
    const next = target === systemScheme() ? null : target;
    try {
      if (next) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage blocked — theme still applies for this session
    }
    setStored(next);
    setSystem(systemScheme());
    applyToDocument(target, next);
  }, []);

  /**
   * Switches to the opposite of the currently rendered scheme.
   * @param {React.MouseEvent} [event] used as the origin of the reveal animation
   */
  const toggleTheme = useCallback(
    (event) => {
      const target = theme === 'dark' ? 'light' : 'dark';
      const root = document.documentElement;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!document.startViewTransition || reduceMotion) {
        root.classList.add('sc-theme-animating');
        commit(target);
        window.setTimeout(() => root.classList.remove('sc-theme-animating'), 450);
        return;
      }

      // Reveal origin = centre of the clicked control (or the viewport centre).
      const rect = event?.currentTarget?.getBoundingClientRect?.();
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      root.style.setProperty('--sc-vt-x', `${x}px`);
      root.style.setProperty('--sc-vt-y', `${y}px`);
      root.style.setProperty('--sc-vt-r', `${radius}px`);

      const transition = document.startViewTransition(() => {
        flushSync(() => commit(target));
      });
      transition.finished.finally(() => {
        root.style.removeProperty('--sc-vt-x');
        root.style.removeProperty('--sc-vt-y');
        root.style.removeProperty('--sc-vt-r');
      });
    },
    [theme, commit],
  );

  const value = useMemo(() => ({ theme, isDark: theme === 'dark', toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
