import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'danger';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: Variant;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  title,
  variant = 'primary',
  style,
  textStyle,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const label = accessibilityLabel ?? title;
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : colors.surfaceAlt;
  const fg =
    variant === 'secondary'
      ? colors.text
      : variant === 'danger'
        ? colors.textInverse
        : colors.textInverse;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
      {...rest}
    >
      <Text style={[styles.text, { color: fg }, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
});
