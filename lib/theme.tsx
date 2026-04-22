'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'nightshade' | 'daylight';

const STORAGE_KEY = 'dream-theme';
const DEFAULT_THEME: Theme = 'nightshade';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'daylight') {
    root.classList.add('theme-daylight');
    root.classList.remove('dark');
  } else {
    root.classList.remove('theme-daylight');
    root.classList.add('dark');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  // Hydrate from localStorage on mount — pre-hydration class is set by inline script in layout
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === 'nightshade' || stored === 'daylight') {
        setThemeState(stored);
        applyTheme(stored);
      } else {
        applyTheme(DEFAULT_THEME);
      }
    } catch {
      applyTheme(DEFAULT_THEME);
    }
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/**
 * Inline script injected in <head> to set the theme class before hydration,
 * preventing a flash of wrong theme. Embed as dangerouslySetInnerHTML.
 */
export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var root = document.documentElement;
    if (stored === 'daylight') {
      root.classList.add('theme-daylight');
      root.classList.remove('dark');
    } else {
      root.classList.remove('theme-daylight');
      root.classList.add('dark');
    }
  } catch (e) {}
})();
`;
