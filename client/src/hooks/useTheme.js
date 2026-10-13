import { useContext } from 'react';
import { ThemeContext } from '../context/contexts';

/**
 * Current colour scheme and toggle.
 *
 * Usage:
 *   const { theme, isDark, toggleTheme } = useTheme();
 *   <button onClick={toggleTheme}>…</button>
 */
export default function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
