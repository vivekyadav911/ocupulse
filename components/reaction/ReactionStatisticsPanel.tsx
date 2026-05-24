import { Text, View } from 'react-native';
import type { TeamAggregates } from '../../lib/reaction/sessionState';
import { StatReadout } from '../StatReadout';
import { ReactionScatterPlot } from './ReactionScatterPlot';
import { useThemedStyles } from '../../theme/themedStyles';

type ReactionStatisticsPanelProps = {
  teamStats: TeamAggregates | null;
  currentPhase1Ms: number | null;
  currentPhase2Ms: number | null;
  currentPhase3Accuracy: number | null;
};

function fmtStat(value: number | null): string {
  if (value == null) return '—';
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

export function ReactionStatisticsPanel({
  teamStats,
  currentPhase1Ms,
  currentPhase2Ms,
  currentPhase3Accuracy,
}: ReactionStatisticsPanelProps) {
  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    grid: {
      marginBottom: t.spacing.md,
    },
  }));

  const scatterPoints = teamStats?.scatterData ?? [];
  const fallbackScatter =
    currentPhase1Ms != null && currentPhase3Accuracy != null
      ? [{ memberName: 'You', phase1Ms: currentPhase1Ms, phase3AccuracyPct: currentPhase3Accuracy }]
      : [];

  return (
    <View>
      <Text style={styles.title}>Team statistics</Text>
      <View style={styles.grid}>
        <StatReadout
          label="Phase 1 avg (ms)"
          value={fmtStat(teamStats?.phase1Mean ?? currentPhase1Ms)}
        />
        <StatReadout label="Phase 1 std dev" value={fmtStat(teamStats?.phase1StdDev ?? null)} />
        <StatReadout
          label="Phase 2 avg (ms)"
          value={fmtStat(teamStats?.phase2Mean ?? currentPhase2Ms ?? null)}
        />
        <StatReadout label="Phase 2 std dev" value={fmtStat(teamStats?.phase2StdDev ?? null)} />
        <StatReadout
          label="Phase 3 accuracy avg (%)"
          value={fmtStat(teamStats?.phase3AccuracyMean ?? currentPhase3Accuracy ?? null)}
        />
        <StatReadout
          label="Phase 3 accuracy std dev"
          value={fmtStat(teamStats?.phase3AccuracyStdDev ?? null)}
        />
      </View>
      <ReactionScatterPlot points={scatterPoints.length ? scatterPoints : fallbackScatter} />
    </View>
  );
}
