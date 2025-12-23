// V0-Inspired Modern Theme - Aurigraph Enterprise Portal
// Dark mode, glassmorphism, gradients, and stunning visuals

import { createTheme, alpha } from '@mui/material/styles';

// Color palette inspired by v0.dev and modern dark themes
const colors = {
  // Primary brand colors
  brand: {
    primary: '#00FFA3',      // Neon green
    secondary: '#0A84FF',    // Electric blue
    accent: '#FF375F',       // Hot pink accent
    warning: '#FFB800',      // Amber
    success: '#00FFA3',      // Same as primary
    error: '#FF375F',        // Same as accent
  },

  // Background gradients
  gradients: {
    primary: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
    card: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
    accent: 'linear-gradient(135deg, #00FFA3 0%, #0A84FF 100%)',
    danger: 'linear-gradient(135deg, #FF375F 0%, #FF6B9D 100%)',
    warning: 'linear-gradient(135deg, #FFB800 0%, #FFC837 100%)',
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
  },

  // Dark backgrounds
  dark: {
    bg: '#0F172A',           // Main background
    bgLight: '#1E293B',      // Card background
    bgLighter: '#334155',    // Hover states
    border: 'rgba(255, 255, 255, 0.1)',
    text: '#F8FAFC',         // Primary text
    textSecondary: '#94A3B8', // Secondary text
  },

  // Chart colors
  charts: {
    line1: '#00FFA3',
    line2: '#0A84FF',
    line3: '#FF375F',
    line4: '#FFB800',
    area1: 'rgba(0, 255, 163, 0.3)',
    area2: 'rgba(10, 132, 255, 0.3)',
    area3: 'rgba(255, 55, 95, 0.3)',
    area4: 'rgba(255, 184, 0, 0.3)',
  },
};

// Create MUI theme
export const v0Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.brand.primary,
      light: '#33FFB8',
      dark: '#00CC82',
      contrastText: '#0F172A',
    },
    secondary: {
      main: colors.brand.secondary,
      light: '#3D9BFF',
      dark: '#0066CC',
      contrastText: '#FFFFFF',
    },
    error: {
      main: colors.brand.error,
      light: '#FF6B8D',
      dark: '#CC2A4C',
    },
    warning: {
      main: colors.brand.warning,
      light: '#FFC633',
      dark: '#CC9300',
    },
    success: {
      main: colors.brand.success,
      light: '#33FFB8',
      dark: '#00CC82',
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
