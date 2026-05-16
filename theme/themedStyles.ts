import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useAppTheme, type AppTheme } from './useAppTheme';

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: AppTheme) => T,
): T {
  const theme = useAppTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
