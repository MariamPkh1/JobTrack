import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(undefined);

/** Reads the theme the pre-paint script in index.html already applied so React
 *  stays in sync with the <html> class (no flash, no mismatch). */
function initialTheme() {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'dark';
  }
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Ignore storage failures (e.g. private mode).
    }
  }, [theme]);

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
