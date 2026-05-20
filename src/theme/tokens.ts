export const colors = {
  light: {
    background: '#FFFFFF',
    foreground: '#0A0A0A',
    card: '#FFFFFF',
    border: '#E5E5E5',
    muted: '#F4F4F5',
    mutedForeground: '#71717A',
    primary: '#0A84FF',
    primaryForeground: '#FFFFFF',
    destructive: '#EF4444',
    success: '#22C55E',
  },
  dark: {
    background: '#000000',
    foreground: '#FAFAFA',
    card: '#0A0A0A',
    border: '#27272A',
    muted: '#1A1A1A',
    mutedForeground: '#A1A1AA',
    primary: '#0A84FF',
    primaryForeground: '#FFFFFF',
    destructive: '#F87171',
    success: '#4ADE80',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export type ColorScheme = 'light' | 'dark';
export type Theme = (typeof colors)[ColorScheme];
