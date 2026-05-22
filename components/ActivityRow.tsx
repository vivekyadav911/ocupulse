import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

type ActivityRowProps = {
  title: string;
  onPress: () => void;
};

export function ActivityRow({ title, onPress }: ActivityRowProps) {
  const { colors, spacing, radii, typography } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.md,
          backgroundColor: colors.surface,
          marginBottom: spacing.sm,
        },
        title: {
          flex: 1,
          fontSize: typography.body,
          fontWeight: '600',
          color: colors.text,
        },
      }),
    [colors, spacing, radii, typography],
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={`Opens ${title}`}
    >
      <Text style={styles.title}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}
