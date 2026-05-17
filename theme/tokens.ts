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
  lg: 20,
} as const;

export const typography = {
  fontFamily: 'System',
  title: 24,
  subtitle: 18,
  body: 16,
  caption: 13,
} as const;

export type ThemeColors = {
  primary: string;
  accent: string;
  success: string;
  danger: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textInverse: string;
  muted: string;
};

export const lightColors: ThemeColors = {
  primary: '#0B1F3A',
  accent: '#FFB400',
  success: '#2ECC71',
  danger: '#E74C3C',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F6FA',
  text: '#0B1F3A',
  textInverse: '#FFFFFF',
  muted: '#6B7A90',
};

export const darkColors: ThemeColors = {
  primary: '#E8EEF7',
  accent: '#FFB400',
  success: '#2ECC71',
  danger: '#E74C3C',
  surface: '#1A2332',
  surfaceAlt: '#0F1623',
  text: '#F4F6FA',
  textInverse: '#0B1F3A',
  muted: '#9AA8BC',
};

export type ThemeMode = 'light' | 'dark';

export function getColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}

/** @deprecated Prefer `useAppTheme().colors` for theme-aware UI */
export const colors = lightColors;
