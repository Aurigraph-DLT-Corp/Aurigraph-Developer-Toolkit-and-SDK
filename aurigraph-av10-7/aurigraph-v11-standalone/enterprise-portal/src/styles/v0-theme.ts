// Peacock Blue Theme - Aurigraph Enterprise Portal
// Subtle, sophisticated dark mode with peacock blue accents

import { createTheme, alpha } from '@mui/material/styles';

// Peacock Blue color palette - sophisticated and subtle
const colors = {
  // Primary brand colors - Peacock Blue spectrum
  brand: {
    primary: '#00A6A6',      // Peacock teal - main accent
    secondary: '#007C91',    // Deep peacock blue
    accent: '#4ECDC4',       // Light teal accent
    warning: '#E8AA42',      // Warm amber (subtle)
    success: '#2ECC71',      // Soft green
    error: '#E74C3C',        // Soft coral red
  },

  // Background gradients - subtle and professional
  gradients: {
    primary: 'linear-gradient(135deg, #0D1B2A 0%, #1B2838 50%, #0D1B2A 100%)',
    card: 'linear-gradient(135deg, rgba(13, 27, 42, 0.9) 0%, rgba(27, 40, 56, 0.9) 100%)',
    accent: 'linear-gradient(135deg, #00A6A6 0%, #007C91 100%)',
    danger: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
    warning: 'linear-gradient(135deg, #E8AA42 0%, #D4942A 100%)',
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
  },

  // Dark backgrounds - deep navy tones
  dark: {
    bg: '#0D1B2A',           // Deep navy background
    bgLight: '#1B2838',      // Card background
    bgLighter: '#243447',    // Hover states
    border: 'rgba(0, 166, 166, 0.15)',  // Subtle peacock tint
    text: '#E8F4F8',         // Soft white with cool tint
    textSecondary: '#8BA4B4', // Muted blue-gray
  },

  // Chart colors - peacock palette
  charts: {
    line1: '#00A6A6',        // Peacock teal
    line2: '#4ECDC4',        // Light teal
    line3: '#007C91',        // Deep peacock
    line4: '#E8AA42',        // Warm accent
    area1: 'rgba(0, 166, 166, 0.25)',
    area2: 'rgba(78, 205, 196, 0.25)',
    area3: 'rgba(0, 124, 145, 0.25)',
    area4: 'rgba(232, 170, 66, 0.25)',
  },
};

// Create MUI theme
export const v0Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.brand.primary,
      light: '#33C4C4',
      dark: '#008080',
      contrastText: '#0D1B2A',
    },
    secondary: {
      main: colors.brand.secondary,
      light: '#339DAD',
      dark: '#005A6A',
      contrastText: '#FFFFFF',
    },
    error: {
      main: colors.brand.error,
      light: '#EC7063',
      dark: '#C0392B',
    },
    warning: {
      main: colors.brand.warning,
      light: '#F0C05A',
      dark: '#C4872A',
    },
    success: {
      main: colors.brand.success,
      light: '#58D68D',
      dark: '#27AE60',
    },
    background: {
      default: colors.dark.bg,
      paper: colors.dark.bgLight,
    },
    text: {
      primary: colors.dark.text,
      secondary: colors.dark.textSecondary,
    },
    divider: colors.dark.border,
  },

  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      background: colors.gradients.accent,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },

  shape: {
    borderRadius: 12,
  },

  shadows: [
    'none',
    '0 2px 4px rgba(0, 0, 0, 0.1)',
    '0 4px 8px rgba(0, 0, 0, 0.15)',
    '0 8px 16px rgba(0, 0, 0, 0.2)',
    '0 12px 24px rgba(0, 0, 0, 0.25)',
    '0 16px 32px rgba(0, 0, 0, 0.3)',
    '0 20px 40px rgba(0, 0, 0, 0.35)',
    '0 24px 48px rgba(0, 0, 0, 0.4)',
    // Glow shadows
    `0 0 20px ${alpha(colors.brand.primary, 0.4)}`,
    `0 0 30px ${alpha(colors.brand.primary, 0.5)}`,
    `0 0 40px ${alpha(colors.brand.secondary, 0.4)}`,
    `0 0 50px ${alpha(colors.brand.secondary, 0.5)}`,
    `0 0 20px ${alpha(colors.brand.accent, 0.4)}`,
    `0 0 30px ${alpha(colors.brand.accent, 0.5)}`,
    // Extra shadows for cards
    '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    '0 12px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    // Chart shadows
    `0 4px 24px ${alpha(colors.brand.primary, 0.25)}`,
    `0 4px 24px ${alpha(colors.brand.secondary, 0.25)}`,
    // Intense glow
    `0 0 60px ${alpha(colors.brand.primary, 0.6)}, 0 0 30px ${alpha(colors.brand.primary, 0.4)}`,
    `0 0 60px ${alpha(colors.brand.secondary, 0.6)}, 0 0 30px ${alpha(colors.brand.secondary, 0.4)}`,
    // Top shadow
    '0 -8px 32px rgba(0, 0, 0, 0.3)',
    '0 -12px 48px rgba(0, 0, 0, 0.4)',
    // Glass morphism
    '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    '0 12px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    // Final ultimate shadow
    '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: colors.gradients.primary,
          backgroundAttachment: 'fixed',
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.brand.primary} ${colors.dark.bgLight}`,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: colors.dark.bgLight,
          },
          '&::-webkit-scrollbar-thumb': {
            background: colors.brand.primary,
            borderRadius: '4px',
            '&:hover': {
              background: colors.brand.secondary,
            },
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          background: colors.gradients.glass,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${colors.dark.border}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 12px 48px rgba(0, 0, 0, 0.4), 0 0 30px ${alpha(colors.brand.primary, 0.3)}`,
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: colors.gradients.glass,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${colors.dark.border}`,
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '8px',
          padding: '10px 24px',
          transition: 'all 0.3s ease',
        },
        contained: {
          background: colors.gradients.accent,
          boxShadow: `0 4px 16px ${alpha(colors.brand.primary, 0.4)}`,
          '&:hover': {
            boxShadow: `0 6px 24px ${alpha(colors.brand.primary, 0.6)}`,
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            background: alpha(colors.brand.primary, 0.1),
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: '6px',
        },
        filled: {
          background: colors.gradients.glass,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${colors.dark.border}`,
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 4,
          background: alpha(colors.dark.bgLighter, 0.3),
        },
        bar: {
          borderRadius: 4,
          background: colors.gradients.accent,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: colors.dark.bgLight,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${colors.dark.border}`,
          fontSize: '0.875rem',
          padding: '8px 12px',
        },
      },
    },
  },
});

// Glassmorphism utility styles
export const glassStyles = {
  card: {
    background: colors.gradients.glass,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${colors.dark.border}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  },

  cardHover: {
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 12px 48px rgba(0, 0, 0, 0.4), 0 0 30px ${alpha(colors.brand.primary, 0.3)}`,
    },
  },

  glow: (color: string, intensity: number = 0.4) => ({
    boxShadow: `0 0 30px ${alpha(color, intensity)}`,
  }),

  gradient: (from: string, to: string) => ({
    background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
  }),
};

// Animation keyframes
export const animations = {
  pulse: {
    '@keyframes pulse': {
      '0%, 100%': {
        opacity: 1,
      },
      '50%': {
        opacity: 0.7,
      },
    },
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },

  glow: {
    '@keyframes glow': {
      '0%, 100%': {
        boxShadow: `0 0 20px ${alpha(colors.brand.primary, 0.4)}`,
      },
      '50%': {
        boxShadow: `0 0 40px ${alpha(colors.brand.primary, 0.8)}`,
      },
    },
    animation: 'glow 2s ease-in-out infinite',
  },

  shimmer: {
    '@keyframes shimmer': {
      '0%': {
        backgroundPosition: '-1000px 0',
      },
      '100%': {
        backgroundPosition: '1000px 0',
      },
    },
    background: `linear-gradient(90deg, transparent, ${alpha(colors.brand.primary, 0.2)}, transparent)`,
    backgroundSize: '1000px 100%',
    animation: 'shimmer 2s infinite',
  },

  slideUp: {
    '@keyframes slideUp': {
      '0%': {
        transform: 'translateY(20px)',
        opacity: 0,
      },
      '100%': {
        transform: 'translateY(0)',
        opacity: 1,
      },
    },
    animation: 'slideUp 0.6s ease-out',
  },

  fadeIn: {
    '@keyframes fadeIn': {
      '0%': {
        opacity: 0,
      },
      '100%': {
        opacity: 1,
      },
    },
    animation: 'fadeIn 0.6s ease-out',
  },
};

// Chart theme configuration
export const chartTheme = {
  colors: colors.charts,
  grid: {
    stroke: alpha(colors.dark.border, 0.3),
    strokeDasharray: '3 3',
  },
  axis: {
    stroke: colors.dark.textSecondary,
  },
  tooltip: {
    background: colors.dark.bgLight,
    border: `1px solid ${colors.dark.border}`,
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
};

export { colors };
export default v0Theme;
