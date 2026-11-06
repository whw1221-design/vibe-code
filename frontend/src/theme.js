import { createTheme } from '@mui/material/styles';

export function getTheme(mode) {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#818cf8' : '#4f46e5',
        light: '#a5b4fc',
        dark: isDark ? '#6366f1' : '#3730a3',
        contrastText: isDark ? '#0b1020' : '#ffffff',
      },
      secondary: {
        main: isDark ? '#2dd4bf' : '#0f9d8a',
        contrastText: isDark ? '#052e2b' : '#ffffff',
      },
      success: { main: isDark ? '#4ade80' : '#15803d' },
      warning: { main: isDark ? '#fbbf24' : '#d97706' },
      error: { main: isDark ? '#f87171' : '#dc2626' },
      info: { main: isDark ? '#38bdf8' : '#0284c7' },
      background: isDark
        ? { default: '#090e1a', paper: '#101827' }
        : { default: '#f5f7fb', paper: '#ffffff' },
      text: isDark
        ? { primary: '#e8eefc', secondary: '#94a3b8' }
        : { primary: '#111827', secondary: '#5b6475' },
      divider: isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(15, 23, 42, 0.09)',
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.03em' },
      h2: { fontWeight: 800, letterSpacing: '-0.02em' },
      h3: { fontWeight: 800, letterSpacing: '-0.02em' },
      h4: { fontWeight: 800, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { minWidth: 320 },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, paddingInline: 16 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 18, backgroundImage: 'none' },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: isDark ? '#94a3b8' : '#64748b',
            backgroundColor: isDark ? 'rgba(148, 163, 184, 0.05)' : '#f8fafc',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
      },
    },
  });
}
