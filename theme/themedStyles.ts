import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useAppTheme, type AppTheme } from './useAppTheme';

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: AppTheme) => T,
): T {
  const theme = useAppTheme();
  // factory is typically a module-level function (e.g. activityScreenStyles)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable factory; theme drives recreation
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
