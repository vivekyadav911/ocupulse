import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

type BadgeProps = {
  label: string;
};

export function Badge({ label }: BadgeProps) {
  const { colors, spacing, radii, typography } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        pill: {
          backgroundColor: colors.badgeBg,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radii.xl,
        },
        text: {
          fontSize: typography.caption,
          fontWeight: '700',
          color: colors.accent,
        },
      }),
    [colors, spacing, radii, typography],
  );

  return (
    <View style={styles.pill}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}
