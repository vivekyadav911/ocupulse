import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useGoBack, useShowBackButton } from '../hooks/useGoBack';
import { useAppTheme } from '../theme/useAppTheme';

type BackButtonProps = {
  label?: string;
  compact?: boolean;
};

export function BackButton({ label = 'Back', compact }: BackButtonProps) {
  const show = useShowBackButton();
  const goBack = useGoBack();
  const { colors, spacing, typography } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        btn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          minHeight: 40,
          minWidth: 40,
          paddingHorizontal: compact ? spacing.xs : spacing.sm,
          justifyContent: 'center',
        },
        label: {
          fontSize: typography.body,
          fontWeight: '600',
          color: colors.accent,
        },
      }),
    [colors, spacing, typography, compact],
  );

  if (!show) return null;

  return (
    <Pressable
      style={styles.btn}
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Returns to the previous screen"
    >
      <Ionicons name="chevron-back" size={22} color={colors.accent} />
      {!compact ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}
