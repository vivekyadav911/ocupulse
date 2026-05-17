import React, { useMemo, type PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

export function Card({ children, style, ...rest }: PropsWithChildren<ViewProps>) {
  const { colors, spacing, radii } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding: spacing.md,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
      }),
    [colors, spacing, radii],
  );

  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}
