import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';
import type { ThemeColors } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'danger';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: Variant;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

function variantColors(variant: Variant, colors: ThemeColors) {
  if (variant === 'primary') {
    return { bg: colors.primary, fg: colors.textInverse, borderWidth: 0 as const };
  }
  if (variant === 'danger') {
    return { bg: colors.danger, fg: colors.textInverse, borderWidth: 0 as const };
  }
  return {
    bg: colors.surface,
    fg: colors.text,
    borderWidth: 1 as const,
    borderColor: colors.muted,
  };
}

export function Button({
  title,
  variant = 'primary',
  style,
  textStyle,
  accessibilityLabel,
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
        },
        text: {
          fontSize: typography.body,
          fontWeight: '600',
        },
      }),
    [spacing, radii, typography],
  );

  const label = accessibilityLabel ?? title;
  const palette = variantColors(variant, colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
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
      <Text style={[styles.text, { color: palette.fg }, textStyle]}>{title}</Text>
    </Pressable>
  );
}
