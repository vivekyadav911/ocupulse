import React, { useMemo, type PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

type CardProps = PropsWithChildren<
  ViewProps & {
    accent?: boolean;
    bordered?: boolean;
  }
>;

export function Card({ children, style, accent, bordered, ...rest }: CardProps) {
  const { colors, spacing, radii } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding: spacing.md,
          borderWidth: bordered ? 1 : 0,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        accentBar: {
          position: 'absolute',
          left: 0,
          top: spacing.md,
          bottom: spacing.md,
          width: 4,
          borderRadius: 2,
          backgroundColor: colors.accent,
        },
        inner: {
          paddingLeft: accent ? spacing.sm : 0,
        },
      }),
    [colors, spacing, radii, accent, bordered],
  );

  return (
    <View style={[styles.card, style]} {...rest}>
      {accent ? <View style={styles.accentBar} /> : null}
      <View style={styles.inner}>{children}</View>
    </View>
  );
}
