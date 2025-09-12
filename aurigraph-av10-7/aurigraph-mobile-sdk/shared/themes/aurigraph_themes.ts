/**
 * Aurigraph Mobile SDK Themes
 * 
 * Comprehensive theming system for consistent UI across all platforms
 */

export interface AurigraphTheme {
  name: string;
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  animations: AnimationConfig;
}

export interface ColorPalette {
  // Primary colors
  primary: string;
  primaryVariant: string;
  secondary: string;
  secondaryVariant: string;
  
  // Surface colors
  background: string;
  surface: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  
  // Text colors
  onPrimary: string;
  onSecondary: string;
  onBackground: string;
  onSurface: string;
  onError: string;
  
  // Transaction status colors
  transactionPending: string;
  transactionConfirmed: string;
  transactionFailed: string;
  
  // Chart colors
  chart: {
    primary: string;
    secondary: string;
    accent: string;
    positive: string;
    negative: string;
    neutral: string;
    gradient: string[];
  };
  
  // Special colors
  quantum: string;
  bridge: string;
  staking: string;
}

export interface Typography {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
    mono: string;
  };
  
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  
  lineHeight: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  
  fontWeight: {
    light: string;
    regular: string;
    medium: string;
    semiBold: string;
    bold: string;
  };
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface BorderRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface Shadows {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface AnimationConfig {
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    bounce: string;
  };
  
  spring: {
    tension: number;
    friction: number;
  };
}

// Light Theme
export const aurigraphLightTheme: AurigraphTheme = {
  name: 'Aurigraph Light',
  
  colors: {
    primary: '#007AFF',
    primaryVariant: '#0056CC',
    secondary: '#34C759',
    secondaryVariant: '#248A3D',
    
    background: '#FFFFFF',
    surface: '#F8F9FA',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    info: '#007AFF',
    
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#000000',
    onSurface: '#1C1C1E',
    onError: '#FFFFFF',
    
    transactionPending: '#FF9500',
    transactionConfirmed: '#34C759',
    transactionFailed: '#FF3B30',
    
    chart: {
      primary: '#007AFF',
      secondary: '#34C759',
      accent: '#FF9500',
      positive: '#34C759',
      negative: '#FF3B30',
      neutral: '#8E8E93',
      gradient: ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6'],
    },
    
    quantum: '#5856D6',
    bridge: '#32D74B',
    staking: '#FF9F0A',
  },
  
  typography: {
    fontFamily: {
      regular: 'SF Pro Display',
      medium: 'SF Pro Display Medium',
      bold: 'SF Pro Display Bold',
      mono: 'SF Mono',
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
    },
    
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },
  
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    
    easing: {
      linear: 'cubic-bezier(0, 0, 1, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    
    spring: {
      tension: 280,
      friction: 60,
    },
  },
};

// Dark Theme
export const aurigraphDarkTheme: AurigraphTheme = {
  ...aurigraphLightTheme,
  name: 'Aurigraph Dark',
  
  colors: {
    ...aurigraphLightTheme.colors,
    
    background: '#000000',
    surface: '#1C1C1E',
    
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    
    chart: {
      primary: '#0A84FF',
      secondary: '#32D74B',
      accent: '#FF9F0A',
      positive: '#32D74B',
      negative: '#FF453A',
      neutral: '#8E8E93',
      gradient: ['#0A84FF', '#32D74B', '#FF9F0A', '#FF453A', '#5E5CE6'],
    },
    
    quantum: '#5E5CE6',
    bridge: '#32D74B',
    staking: '#FF9F0A',
  },
};

// Quantum Theme (Special themed experience)
export const aurigraphQuantumTheme: AurigraphTheme = {
  ...aurigraphLightTheme,
  name: 'Aurigraph Quantum',
  
  colors: {
    ...aurigraphLightTheme.colors,
    
    primary: '#5856D6',
    primaryVariant: '#4B46C7',
    secondary: '#AF52DE',
    secondaryVariant: '#9A3FBE',
    
    background: '#0A0A0F',
    surface: '#1A1A2E',
    
    onBackground: '#E5E5E7',
    onSurface: '#F2F2F7',
    
    chart: {
      primary: '#5856D6',
      secondary: '#AF52DE',
      accent: '#FF2D92',
      positive: '#32D74B',
      negative: '#FF453A',
      neutral: '#8E8E93',
      gradient: ['#5856D6', '#AF52DE', '#FF2D92', '#32D74B', '#FF9F0A'],
    },
    
    quantum: '#5856D6',
    bridge: '#AF52DE',
    staking: '#FF2D92',
  },
};

// Theme utilities
export class ThemeManager {
  private static currentTheme: AurigraphTheme = aurigraphLightTheme;
  
  static getCurrentTheme(): AurigraphTheme {
    return this.currentTheme;
  }
  
  static setTheme(theme: AurigraphTheme): void {
    this.currentTheme = theme;
    this.notifyThemeChange();
  }
  
  static getThemeByName(name: string): AurigraphTheme | null {
    const themes = [aurigraphLightTheme, aurigraphDarkTheme, aurigraphQuantumTheme];
    return themes.find(theme => theme.name === name) || null;
  }
  
  static getAllThemes(): AurigraphTheme[] {
    return [aurigraphLightTheme, aurigraphDarkTheme, aurigraphQuantumTheme];
  }
  
  static isDarkTheme(): boolean {
    return this.currentTheme.name.toLowerCase().includes('dark') || 
           this.currentTheme.name.toLowerCase().includes('quantum');
  }
  
  static getColorWithOpacity(color: string, opacity: number): string {
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  static getGradient(colors: string[], direction: string = 'linear'): string {
    return `${direction}-gradient(${colors.join(', ')})`;
  }
  
  private static notifyThemeChange(): void {
    // Platform-specific theme change notifications
    if (typeof window !== 'undefined' && window.postMessage) {
      window.postMessage({
        type: 'AURIGRAPH_THEME_CHANGED',
        theme: this.currentTheme
      }, '*');
    }
  }
}

// CSS-in-JS helper for React Native
export const createStyles = (theme: AurigraphTheme) => ({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  
  surface: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  primaryButtonText: {
    color: theme.colors.onPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    fontFamily: theme.typography.fontFamily.medium,
  },
  
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.onSurface,
    borderWidth: 1,
    borderColor: ThemeManager.getColorWithOpacity(theme.colors.onSurface, 0.2),
  },
  
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.sm,
  },
  
  body: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.regular,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.onSurface,
    lineHeight: theme.typography.lineHeight.md,
  },
  
  caption: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.regular,
    fontFamily: theme.typography.fontFamily.regular,
    color: ThemeManager.getColorWithOpacity(theme.colors.onSurface, 0.7),
  },
});