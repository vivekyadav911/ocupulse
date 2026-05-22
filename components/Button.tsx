import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';
import type { ThemeColors } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'accent' | 'danger';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityHint?: string;
};

function variantColors(variant: Variant, colors: ThemeColors) {
  if (variant === 'primary') {
    return {
      bg: colors.primaryButton,
      fg: colors.textInverse,
      borderWidth: 0 as const,
    };
  }
  if (variant === 'danger') {
    return { bg: colors.danger, fg: colors.textInverse, borderWidth: 0 as const };
  }
  if (variant === 'accent') {
    return {
      bg: colors.surface,
      fg: colors.accent,
      borderWidth: 1 as const,
      borderColor: colors.accent,
    };
  }
  return {
    bg: colors.surface,
    fg: colors.text,
    borderWidth: 1 as const,
    borderColor: colors.text,
  };
}

export function Button({
  title,
  variant = 'primary',
  icon,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: ButtonProps) {
  const { colors, spacing, radii, typography } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          minHeight: 48,
          minWidth: 48,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radii.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: spacing.sm,
        },
        text: {
          fontSize: typography.body,
          fontWeight: '600',
        },
      }),
    [spacing, radii, typography],
  );

  const label = accessibilityLabel ?? title;
  const hint = accessibilityHint ?? `Activates ${title}`;
  const palette = variantColors(variant, colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderWidth: palette.borderWidth,
          borderColor: 'borderColor' in palette ? palette.borderColor : undefined,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={palette.fg}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
      <Text style={[styles.text, { color: palette.fg }, textStyle]}>{title}</Text>
    </Pressable>
  );
}
