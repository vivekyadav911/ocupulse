import { Text, View } from 'react-native';
import type { SoundSessionSummary } from '../lib/sound/sessionState';
import { StatReadout } from './StatReadout';
import { useThemedStyles } from '../theme/themedStyles';

type SoundSummaryCardProps = {
  summary: SoundSessionSummary | null;
};

export function SoundSummaryCard({ summary }: SoundSummaryCardProps) {
  const styles = useThemedStyles((t) => ({
    card: {
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
      padding: t.spacing.md,
      borderRadius: t.radii.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.readoutBg,
    },
    title: {
      fontSize: t.typography.subtitle,
      fontWeight: '800' as const,
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    empty: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      lineHeight: 18,
    },
    recommendation: {
      marginTop: t.spacing.sm,
      padding: t.spacing.sm,
      borderRadius: t.radii.md,
      borderWidth: 1,
    },
    recommendationYes: {
      borderColor: t.colors.danger,
      backgroundColor: t.colors.danger + '15',
    },
    recommendationNo: {
      borderColor: t.colors.success,
      backgroundColor: t.colors.success + '15',
    },
    recommendationText: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
    },
  }));

  if (!summary) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Session summary</Text>
        <Text style={styles.empty}>Capture at least one reading to see session stats.</Text>
      </View>
    );
  }

  const earYes = summary.earProtectionRecommended;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Session summary</Text>
      <StatReadout label="Loudest action" value={summary.loudestAction} />
      <StatReadout label="Quietest action" value={summary.quietestAction} />
      <StatReadout label="Average dB" value={`${summary.avgDb} dB`} />
      <View
        style={[styles.recommendation, earYes ? styles.recommendationYes : styles.recommendationNo]}
      >
        <Text style={styles.recommendationText}>
          Should your class wear ear protection? {earYes ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );
}
