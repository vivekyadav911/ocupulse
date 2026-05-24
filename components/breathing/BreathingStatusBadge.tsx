import { Text, View } from 'react-native';
import { bpmStatus, bpmStatusLabel } from '../../lib/breathing/breathingSignal';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

type BreathingStatusBadgeProps = {
  bpm: number;
};

function statusColor(
  status: ReturnType<typeof bpmStatus>,
  colors: ReturnType<typeof useAppTheme>['colors'],
): string {
  switch (status) {
    case 'low':
      return colors.accent;
    case 'normal':
      return colors.success;
    case 'elevated':
      return '#E8A838';
    case 'high':
      return colors.danger;
  }
}

export function BreathingStatusBadge({ bpm }: BreathingStatusBadgeProps) {
  const { colors } = useAppTheme();

  const styles = useThemedStyles((t) => ({
    wrap: {
      alignItems: 'center' as const,
      marginVertical: t.spacing.md,
    },
    bpm: {
      fontSize: 48,
      fontWeight: '800' as const,
      color: t.colors.text,
      lineHeight: 52,
    },
    unit: {
      fontSize: t.typography.body,
      color: t.colors.muted,
      marginBottom: t.spacing.sm,
    },
    badge: {
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.xs,
      borderRadius: 999,
    },
    badgeText: {
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
      color: '#fff',
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
    },
    empty: {
      fontSize: 48,
      fontWeight: '800' as const,
      color: t.colors.muted,
    },
  }));

  if (bpm <= 0) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.empty}>—</Text>
        <Text style={styles.unit}>breaths / min</Text>
      </View>
    );
  }

  const band = bpmStatus(bpm);
  const bg = statusColor(band, colors);

  return (
    <View style={styles.wrap}>
      <Text style={styles.bpm}>{bpm.toFixed(1)}</Text>
      <Text style={styles.unit}>breaths / min</Text>
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={styles.badgeText}>{bpmStatusLabel(band)}</Text>
      </View>
    </View>
  );
}
