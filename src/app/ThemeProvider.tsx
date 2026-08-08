import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '@/lib/hooks';

type Theme = 'light' | 'dark';

interface ThemeApi {
  theme: Theme;
  toggle: () => void;
  set: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeApi | null>(null);
const STORAGE_KEY = 'teatap.theme';

/**
 * Theme is a single class on <html>; every colour in the app resolves through
 * CSS custom properties, so flipping it repaints the whole console — charts
 * included — with no React re-render of the tree.
 *
 * The first paint is handled by an inline script in index.html; this provider
 * only owns subsequent changes.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<Theme>(STORAGE_KEY, 'light');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    [setTheme],
  );

  const value = useMemo<ThemeApi>(
    () => ({ theme, toggle, set: setTheme }),
    [theme, toggle, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeApi {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
