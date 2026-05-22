import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

export type StatReadoutProps = {
  label: string;
  value: string;
};

export function StatReadout({ label, value }: StatReadoutProps) {
  const { colors, spacing, radii, typography } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginVertical: spacing.xs,
          backgroundColor: colors.readoutBg,
          borderRadius: radii.md,
          padding: spacing.md,
        },
        value: {
          fontSize: typography.title,
          fontWeight: '800',
          color: colors.text,
        },
        label: {
          fontSize: typography.label,
          color: colors.muted,
          marginTop: spacing.xs,
          fontWeight: '600',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
      }),
    [colors, spacing, radii, typography],
  );

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
