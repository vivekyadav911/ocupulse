import { useMemo } from 'react';
import { useThemeStore } from '../store/themeStore';
import { getColors, radii, spacing, typography, type ThemeColors, type ThemeMode } from './tokens';

export type AppTheme = {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
};

export function useAppTheme(): AppTheme {
  const mode = useThemeStore((s) => s.mode);
  return useMemo(
    () => ({
      mode,
      colors: getColors(mode),
      spacing,
      radii,
      typography,
    }),
    [mode],
  );
}
