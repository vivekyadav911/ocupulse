import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

type PageTitleProps = {
  eyebrow?: string;
  title: string;
};

export function PageTitle({ eyebrow, title }: PageTitleProps) {
  const { colors, spacing, typography } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { marginBottom: spacing.md },
        eyebrow: {
          fontSize: typography.label,
          fontWeight: '600',
          color: colors.muted,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: spacing.xs,
        },
        title: {
          fontSize: typography.title,
          fontWeight: '800',
          color: colors.text,
        },
        mono: {
          fontSize: typography.caption,
          fontWeight: '600',
          color: colors.muted,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          fontFamily: 'monospace',
          marginTop: spacing.xs,
        },
      }),
    [colors, spacing, typography],
  );

  return (
    <View style={styles.wrap}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

export function TeamSubtitle({ team }: { team: string }) {
  const { colors, spacing, typography } = useAppTheme();
  return (
    <Text
      style={{
        fontSize: typography.caption,
        fontWeight: '600',
        color: colors.muted,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        fontFamily: 'monospace',
        marginBottom: spacing.md,
      }}
    >
      Team: {team}
    </Text>
  );
}
