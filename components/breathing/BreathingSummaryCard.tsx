import { Text, View } from 'react-native';
import {
  buildTeamInsightText,
  type BreathingTeamAggregates,
} from '../../lib/breathing/sessionState';
import { useThemedStyles } from '../../theme/themedStyles';

type BreathingSummaryCardProps = {
  aggregates: BreathingTeamAggregates | null;
};

export function BreathingSummaryCard({ aggregates }: BreathingSummaryCardProps) {
  const styles = useThemedStyles((t) => ({
    card: {
      padding: t.spacing.md,
      borderRadius: t.radii.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.readoutBg,
      marginBottom: t.spacing.md,
    },
    title: {
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
      color: t.colors.muted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
      marginBottom: t.spacing.sm,
    },
    body: {
      fontSize: t.typography.body,
      color: t.colors.text,
      lineHeight: 24,
    },
  }));

  const text = aggregates ? buildTeamInsightText(aggregates) : null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Team insight</Text>
      <Text style={styles.body}>
        {text ?? 'Complete all three recordings and sync with your team to generate an insight.'}
      </Text>
    </View>
  );
}
