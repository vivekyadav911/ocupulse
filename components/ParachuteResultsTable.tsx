import { ScrollView, Text, View } from 'react-native';
import type { ChallengeReflection } from '../lib/parachute/challengeState';
import type { RunSummary } from '../lib/parachute/runSummary';
import { bestRunIndex, fmtCalc } from '../lib/parachute/runSummary';
import { activityScreenStyles } from '../theme/activityScreenStyles';
import { useThemedStyles } from '../theme/themedStyles';
import { FormField } from './FormField';

type ParachuteResultsTableProps = {
  runs: RunSummary[];
  reflection: ChallengeReflection;
  onReflectionChange: (partial: Partial<ChallengeReflection>) => void;
};

const COLUMNS = [
  'Design',
  'Predicted (s)',
  'Actual (s)',
  'Velocity (m/s)',
  'G-force',
  'Risk',
] as const;

export function ParachuteResultsTable({
  runs,
  reflection,
  onReflectionChange,
}: ParachuteResultsTableProps) {
  const bestIdx = bestRunIndex(runs);

  const styles = useThemedStyles((t) => ({
    ...activityScreenStyles(t),
    sectionTitle: {
      fontSize: t.typography.subtitle,
      fontWeight: '800' as const,
      color: t.colors.text,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
    },
    tableScroll: { marginBottom: t.spacing.md },
    headerRow: {
      flexDirection: 'row' as const,
      borderBottomWidth: 2,
      borderBottomColor: t.colors.border,
      paddingVertical: t.spacing.sm,
      minWidth: 640,
    },
    dataRow: {
      flexDirection: 'row' as const,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      paddingVertical: t.spacing.sm,
      minWidth: 640,
    },
    bestRow: {
      backgroundColor: t.colors.success + '22',
      borderColor: t.colors.success,
    },
    headerCell: {
      flex: 1,
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
      color: t.colors.muted,
      textTransform: 'uppercase' as const,
      paddingHorizontal: t.spacing.xs,
    },
    cell: {
      flex: 1,
      fontSize: t.typography.caption,
      color: t.colors.text,
      paddingHorizontal: t.spacing.xs,
    },
    badge: {
      marginTop: t.spacing.xs,
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
      color: t.colors.success,
    },
    reflectionTitle: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
    },
    multiline: {
      minHeight: 72,
      textAlignVertical: 'top' as const,
    },
  }));

  return (
    <View>
      <Text style={styles.sectionTitle}>Results summary</Text>
      <ScrollView horizontal style={styles.tableScroll} showsHorizontalScrollIndicator>
        <View>
          <View style={styles.headerRow}>
            {COLUMNS.map((col) => (
              <Text key={col} style={styles.headerCell}>
                {col}
              </Text>
            ))}
          </View>
          {runs.map((run, index) => {
            const isBest = bestIdx === index;
            return (
              <View key={run.tabKey} style={[styles.dataRow, isBest && styles.bestRow]}>
                <Text style={styles.cell}>{run.designName}</Text>
                <Text style={styles.cell}>{fmtCalc(run.predictedFallTimeS, 2)}</Text>
                <Text style={styles.cell}>{fmtCalc(run.recordedFallTimeS, 2)}</Text>
                <Text style={styles.cell}>{fmtCalc(run.finalVelocityMps, 2)}</Text>
                <Text style={styles.cell}>{fmtCalc(run.gForce, 2)}</Text>
                <View style={{ flex: 1, paddingHorizontal: 4 }}>
                  <Text style={styles.cell}>{run.riskLabel ?? '—'}</Text>
                  {isBest ? <Text style={styles.badge}>Best parachute</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Text style={styles.reflectionTitle}>Reflection</Text>
      <FormField
        label="Which design was best?"
        value={reflection.bestDesign}
        onChangeText={(bestDesign) => onReflectionChange({ bestDesign })}
        multiline
        style={styles.multiline}
      />
      <FormField
        label="Which was easiest to make?"
        value={reflection.easiestDesign}
        onChangeText={(easiestDesign) => onReflectionChange({ easiestDesign })}
        multiline
        style={styles.multiline}
      />
      <FormField
        label="Were your predictions correct?"
        value={reflection.predictionsCorrect}
        onChangeText={(predictionsCorrect) => onReflectionChange({ predictionsCorrect })}
        multiline
        style={styles.multiline}
      />
    </View>
  );
}
