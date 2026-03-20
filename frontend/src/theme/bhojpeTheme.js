/**
 * Bhojpe POSS Design System
 * Warm, Earthy Color Palette for Modern Indian Restaurant Management
 * 
 * Based on: bhojpe_Software.html design system
 * Primary Accent: #E8332A (warm red/orange)
 */

export const bhojpeTheme = {
  // Primary Colors
  colors: {
    // Main Accent (Warm Red/Orange)
    primary: '#E8332A',
    primaryHover: '#c8271f',
    primaryDim: 'rgba(232, 51, 42, 0.07)',
    primaryBorder: 'rgba(232, 51, 42, 0.2)',
    
    // Backgrounds (Warm Cream/Beige)
    bg: '#f9f4ef',
    bgSecondary: '#fff5f0',
    surface1: '#fdfaf7',
    surface2: '#f2ece5',
    surface3: '#e8e0d8',
    white: '#ffffff',
    
    // Borders
    borderLight: '#e4dbd0',
    borderDark: '#cec4b8',
    border: '#e8ddd5',
    border2: '#d4c8bc',
    
    // Text
    textPrimary: '#1a1410',
    textSecondary: '#6b5c4e',
    textMuted: '#a8978a',
    
    // Status Colors
    success: '#186b35',
    successDim: 'rgba(24, 107, 53, 0.1)',
    error: '#b81c1c',
    errorDim: 'rgba(184, 28, 28, 0.1)',
    warning: '#7a5a00',
    warningDim: 'rgba(122, 90, 0, 0.1)',
    info: '#1a4fcc',
    infoDim: 'rgba(26, 79, 204, 0.1)',
    orange: '#c2610a',
    orangeDim: 'rgba(194, 97, 10, 0.1)',
    
    // Sidebar (Dark)
    sidebarBg: '#0f1117',
    sidebarLocation: '#161b27',
  },
  
  // Typography
  typography: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontFamilyMono: "'JetBrains Mono', monospace",
    
    // Font Sizes
    fontSize: {
      xs: '10px',
      sm: '11px',
      base: '13px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
      '4xl': '36px',
    },
    
    // Font Weights
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
  },
  
  // Spacing & Layout
  spacing: {
    borderRadius: '10px',
    borderRadiusLg: '14px',
    gap: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
    },
    padding: {
      sm: '8px 12px',
      md: '12px 18px',
      lg: '14px 22px',
      xl: '17px',
    },
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 6px rgba(0, 0, 0, 0.1)',
    xl: '0 8px 12px rgba(0, 0, 0, 0.15)',
  },
  
  // Component Specific
  components: {
    // Buttons
    button: {
      primary: {
        bg: '#E8332A',
        color: '#ffffff',
        hover: '#c8271f',
        shadow: '0 2px 4px rgba(232, 51, 42, 0.3)',
      },
      secondary: {
        bg: '#f2ece5',
        color: '#1a1410',
        hover: '#e8ddd5',
      },
      success: {
        bg: '#186b35',
        color: '#ffffff',
        hover: '#145028',
      },
    },
    
    // Cards
    card: {
      bg: '#ffffff',
      border: '#e8ddd5',
      borderRadius: '10px',
      shadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      hover: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    
    // Inputs
    input: {
      bg: '#ffffff',
      border: '#d4c8bc',
      borderFocus: '#E8332A',
      padding: '10px 14px',
      borderRadius: '8px',
    },
    
    // Status Pills/Badges
    status: {
      available: {
        bg: 'rgba(24, 107, 53, 0.1)',
        color: '#186b35',
        border: 'rgba(24, 107, 53, 0.3)',
      },
      occupied: {
        bg: 'rgba(184, 28, 28, 0.1)',
        color: '#b81c1c',
        border: 'rgba(184, 28, 28, 0.3)',
      },
      reserved: {
        bg: 'rgba(122, 90, 0, 0.1)',
        color: '#7a5a00',
        border: 'rgba(122, 90, 0, 0.3)',
      },
      preparing: {
        bg: 'rgba(194, 97, 10, 0.1)',
        color: '#c2610a',
        border: 'rgba(194, 97, 10, 0.3)',
      },
    },
  },
}

// MUI Theme Override (for Material-UI components)
export const muiThemeOverride = {
  palette: {
    primary: {
      main: '#E8332A',
      dark: '#c8271f',
      light: '#ff5545',
    },
    secondary: {
      main: '#6b5c4e',
    },
    background: {
      default: '#f9f4ef',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1410',
      secondary: '#6b5c4e',
      disabled: '#a8978a',
    },
    success: {
      main: '#186b35',
    },
    error: {
      main: '#b81c1c',
    },
    warning: {
      main: '#7a5a00',
    },
    info: {
      main: '#1a4fcc',
    },
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          padding: '10px 20px',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(232, 51, 42, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(232, 51, 42, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': {
              borderColor: '#d4c8bc',
            },
            '&:hover fieldset': {
              borderColor: '#cec4b8',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#E8332A',
            },
          },
        },
      },
    },
  },
}

export default bhojpeTheme
