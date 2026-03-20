import { createTheme } from '@mui/material/styles'

const brandColor = '#FF3D01'
const brandDark = '#dd3400'

// Shared design tokens
const tokens = {
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  borderRadius: 10,
}

export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: brandColor,
      dark: brandDark,
      light: '#ff6633',
      contrastText: '#fff',
    },
    success: { main: '#186b35' },
    warning: { main: '#7a5a00' },
    error: { main: '#b81c1c' },
    info: { main: '#1a4fcc' },
    background: {
      default: mode === 'light' ? '#f8f5f1' : '#0f1117',
      paper: mode === 'light' ? '#ffffff' : '#161b27',
    },
    divider: mode === 'light' ? '#e4dbd0' : 'rgba(255,255,255,0.08)',
    text: {
      primary: mode === 'light' ? '#24201c' : '#f0ede9',
      secondary: mode === 'light' ? '#68594a' : 'rgba(255,255,255,0.55)',
      disabled: mode === 'light' ? '#a4927e' : 'rgba(255,255,255,0.3)',
    },
  },
  typography: {
    fontFamily: tokens.fontFamily,
    h1: { fontWeight: 900, letterSpacing: '-1.5px' },
    h2: { fontWeight: 800, letterSpacing: '-1px' },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body1: { fontWeight: 500 },
    button: { fontWeight: 700, textTransform: 'none', letterSpacing: '0.2px' },
    caption: { fontWeight: 600 },
    overline: { fontWeight: 700, letterSpacing: '0.8px' },
  },
  shape: { borderRadius: tokens.borderRadius },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius,
          fontFamily: tokens.fontFamily,
          fontWeight: 700,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${brandColor}, ${brandDark})`,
          '&:hover': { background: brandDark },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: tokens.borderRadius,
            fontFamily: tokens.fontFamily,
            fontWeight: 500,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: mode === 'light'
            ? '0 1px 0 #e4dbd0, 0 2px 10px rgba(0,0,0,0.05)'
            : '0 2px 16px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, fontFamily: tokens.fontFamily },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          fontFamily: tokens.fontFamily,
          '& .MuiDataGrid-columnHeader': { fontWeight: 700 },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: mode === 'dark' ? '#0f1117' : '#1a1e2e',
          color: '#fff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 0 #e4dbd0, 0 2px 10px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' },
      },
    },
  },
})
