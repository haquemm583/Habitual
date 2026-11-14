/*
  ThemeProvider.jsx

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { ThemeContext } from '../../theme/ThemeContext';

function ThemeProvider({ children }) {
  // Reuse the theme applied by index.html before React loads.
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const applyTheme = () => {
      document.documentElement.dataset.theme = nextTheme;
      setTheme(nextTheme);
    };

    // Fade the whole page together without changing individual UI transitions.
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(() => flushSync(applyTheme));
    } else {
      applyTheme();
    }
    try {
      localStorage.setItem('habitual-theme', nextTheme);
    } catch {
      // The toggle still works when browser storage is unavailable.
    }
  }

  return (
    <ThemeContext.Provider value={{ dark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
