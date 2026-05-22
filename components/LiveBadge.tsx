import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

export function LiveBadge() {
  const { colors, spacing, radii, typography } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        pill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          backgroundColor: colors.badgeBg,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radii.xl,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.success,
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
      <View style={styles.dot} />
      <Text style={styles.text}>Live</Text>
    </View>
  );
}
