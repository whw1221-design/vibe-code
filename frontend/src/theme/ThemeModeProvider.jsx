import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { getTheme } from '../theme.js';

const STORAGE_KEY = 'crud-studio-color-mode';
const ColorModeContext = createContext(null);

function getInitialMode() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      mode === 'dark' ? '#090e1a' : '#4f46e5'
    );
  }, [mode]);

  const theme = useMemo(() => getTheme(mode), [mode]);
  const value = useMemo(
    () => ({
      mode,
      toggle: () => setMode((current) => (current === 'light' ? 'dark' : 'light')),
    }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const context = useContext(ColorModeContext);
  if (!context) throw new Error('useColorMode must be used inside ThemeModeProvider.');
  return context;
}
