import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

type FormFieldProps = TextInputProps & {
  label: string;
};

export function FormField({ label, style, ...rest }: FormFieldProps) {
  const { colors, spacing, radii, typography } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: {
          fontSize: typography.label,
          fontWeight: '700',
          color: colors.muted,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginTop: spacing.sm,
          marginBottom: spacing.xs,
        },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.md,
          padding: spacing.sm,
          color: colors.text,
          backgroundColor: colors.surface,
          fontSize: typography.body,
        },
      }),
    [colors, spacing, radii, typography],
  );

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={[styles.input, style]} {...rest} />
    </>
  );
}
