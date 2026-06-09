export const colors = {
  light: {
    background: '#F5F7FA',
    foreground: '#0F172A',
    card: '#FFFFFF',
    border: '#D8E0EA',
    muted: '#EEF2F7',
    mutedForeground: '#64748B',
    primary: '#1E4976',
    primaryForeground: '#FFFFFF',
    accent: '#0B6EAE',
    brand: '#1E4976',
    brandMuted: '#E8F0F8',
    destructive: '#DC2626',
    success: '#16A34A',
  },
  dark: {
    background: '#0B1220',
    foreground: '#F1F5F9',
    card: '#111827',
    border: '#2A3A52',
    muted: '#1A2438',
    mutedForeground: '#94A3B8',
    primary: '#3B82C4',
    primaryForeground: '#FFFFFF',
    accent: '#38BDF8',
    brand: '#3B82C4',
    brandMuted: '#1A2D45',
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

/**
 * Sombras premium por nivel de elevación. En dark mode las sombras
 * son más profundas y opacas para mantener separación visual.
 */
export const elevation = {
  light: {
    sm: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    md: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
    lg: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 12 },
  },
  dark: {
    sm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 1 },
    md: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 18, elevation: 6 },
    lg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 14 },
  },
} as const;

/** Gradiente de header por tema (de marca → más oscuro para profundidad). */
export const headerGradient = {
  light: ['#23578C', '#1E4976', '#173A5E'] as const,
  dark: ['#1B2C44', '#142133', '#0D1626'] as const,
};

export type ColorScheme = 'light' | 'dark';
export type Theme = (typeof colors)[ColorScheme];
export type ElevationLevel = keyof (typeof elevation)['light'];
