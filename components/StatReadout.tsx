import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

export type StatReadoutProps = {
  label: string;
  value: string;
};

export function StatReadout({ label, value }: StatReadoutProps) {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
