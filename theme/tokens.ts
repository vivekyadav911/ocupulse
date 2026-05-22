export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const typography = {
  fontFamily: 'System',
  title: 28,
  subtitle: 18,
  body: 16,
  caption: 12,
  label: 11,
} as const;

export type ThemeColors = {
  primary: string;
  primaryButton: string;
  accent: string;
  accentMuted: string;
  success: string;
  danger: string;
  surface: string;
  surfaceAlt: string;
  authBg: string;
  readoutBg: string;
  text: string;
  textInverse: string;
  muted: string;
  border: string;
  badgeBg: string;
};

export const lightColors: ThemeColors = {
  primary: '#101D2D',
  primaryButton: '#121926',
  accent: '#008282',
  accentMuted: '#B8E6E6',
  success: '#22C55E',
  danger: '#E74C3C',
  surface: '#FFFFFF',
  surfaceAlt: '#F8F9FB',
  authBg: '#F0F7FF',
  readoutBg: '#E8F4F8',
  text: '#101D2D',
  textInverse: '#FFFFFF',
  muted: '#6B7280',
  border: '#D1D5DB',
  badgeBg: '#D4F0F0',
};

export const darkColors: ThemeColors = {
  primary: '#E8EEF7',
  primaryButton: '#1E3A5F',
  accent: '#2DD4BF',
  accentMuted: '#134E4A',
  success: '#22C55E',
  danger: '#F87171',
  surface: '#1A2332',
  surfaceAlt: '#0F1623',
  authBg: '#0F1623',
  readoutBg: '#1A2E38',
  text: '#F4F6FA',
  textInverse: '#101D2D',
  muted: '#9CA3AF',
  border: '#374151',
  badgeBg: '#134E4A',
};

export type ThemeMode = 'light' | 'dark';

export function getColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}

/** @deprecated Prefer `useAppTheme().colors` for theme-aware UI */
export const colors = lightColors;
