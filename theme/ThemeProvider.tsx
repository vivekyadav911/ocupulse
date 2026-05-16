import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useAppTheme } from './useAppTheme';

export function ThemeProvider({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  return <View style={{ flex: 1, backgroundColor: colors.surfaceAlt }}>{children}</View>;
}
