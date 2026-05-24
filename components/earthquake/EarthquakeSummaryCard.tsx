import { Text, View } from 'react-native';
import { summarizeDesignRuns } from '../../lib/calc/earthquakeDisplacement';
import { runsAsArray, type EarthquakeDesignRun } from '../../lib/earthquake/sessionState';
import { StatReadout } from '../StatReadout';
import { useThemedStyles } from '../../theme/themedStyles';

type EarthquakeSummaryCardProps = {
  runs: Record<1 | 2 | 3, EarthquakeDesignRun>;
};

export function EarthquakeSummaryCard({ runs }: EarthquakeSummaryCardProps) {
  const completed = runsAsArray(runs).filter((r) => r.readings != null);
  const summary =
    completed.length > 0
      ? summarizeDesignRuns(
          completed.map((r) => ({
            design: r.design,
            folds: Number.parseInt(r.folds, 10) || 0,
            pillars: Number.parseInt(r.pillars, 10) || 0,
            peakDisplacementCm: r.readings!.peakDisplacementCm,
          })),
        )
      : null;

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
  }));

  if (!summary?.bestDesign) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Summary</Text>
        <Text style={styles.empty}>Complete at least one design test to see the summary.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Summary</Text>
      <StatReadout label="Best performing design" value={`Design ${summary.bestDesign}`} />
      <StatReadout
        label="Best peak displacement"
        value={`${summary.bestPeakCm?.toFixed(2) ?? '—'} cm`}
      />
      <StatReadout label="Winning fold count" value={`${summary.winningFolds ?? '—'}`} />
      <StatReadout label="Winning pillar count" value={`${summary.winningPillars ?? '—'}`} />
    </View>
  );
}
