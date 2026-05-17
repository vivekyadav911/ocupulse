import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

export type StatReadoutProps = {
  label: string;
  value: string;
};

export function StatReadout({ label, value }: StatReadoutProps) {
  const { colors, spacing, typography } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { marginVertical: spacing.sm },
        value: {
          fontSize: typography.title,
          fontWeight: '700',
          color: colors.primary,
        },
        label: {
          fontSize: typography.caption,
          color: colors.muted,
          marginTop: spacing.xs,
        },
      }),
    [colors, spacing, typography],
  );

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
