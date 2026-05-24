import { Text, View } from 'react-native';
import { hardestMovement } from '../../lib/calc/humanperfJerk';
import { attemptsAsArray, movementLabel } from '../../lib/humanperf/sessionState';
import type { HumanperfSessionState } from '../../lib/humanperf/sessionState';
import { useThemedStyles } from '../../theme/themedStyles';

type HumanperfHardestMovementCardProps = {
  attempts: HumanperfSessionState['attempts'];
};

export function HumanperfHardestMovementCard({ attempts }: HumanperfHardestMovementCardProps) {
  const rows = attemptsAsArray(attempts);
  const hardest =
    rows.length > 0
      ? hardestMovement(rows.map((a) => ({ movement: a.movement, avgJerkMm: a.avgJerkMm })))
      : null;

  const styles = useThemedStyles((t) => ({
    card: {
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
      padding: t.spacing.md,
      borderRadius: t.radii.lg,
      borderWidth: 1,
      borderColor: t.colors.accent,
      backgroundColor: t.colors.accent + '12',
    },
    title: {
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
      color: t.colors.accent,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
      marginBottom: t.spacing.xs,
    },
    movement: {
      fontSize: t.typography.subtitle,
      fontWeight: '800' as const,
      color: t.colors.text,
    },
    detail: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginTop: t.spacing.xs,
      lineHeight: 18,
    },
    empty: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      lineHeight: 18,
    },
  }));

  if (!hardest) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Hardest movement</Text>
        <Text style={styles.empty}>
          Complete at least one attempt to see which movement was roughest.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card} accessibilityLabel="Hardest movement callout">
      <Text style={styles.title}>Hardest movement</Text>
      <Text style={styles.movement}>
        {hardest.movement}. {movementLabel(hardest.movement)}
      </Text>
      <Text style={styles.detail}>
        Highest average jerk across your attempts — {hardest.avgJerkMm.toFixed(1)} mm. This movement
        was hardest to keep smooth.
      </Text>
    </View>
  );
}
