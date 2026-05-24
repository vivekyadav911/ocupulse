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
  { key: 'design', label: 'Design', width: 100 },
  { key: 'predicted', label: 'Predicted (s)', width: 88 },
  { key: 'actual', label: 'Actual (s)', width: 80 },
  { key: 'velocity', label: 'Velocity (m/s)', width: 96 },
  { key: 'gforce', label: 'G-force', width: 72 },
  { key: 'risk', label: 'Risk', width: 88 },
] as const;

function cellValue(run: RunSummary, key: (typeof COLUMNS)[number]['key']): string {
  switch (key) {
    case 'design':
      return run.designName;
    case 'predicted':
      return fmtCalc(run.predictedFallTimeS, 2);
    case 'actual':
      return fmtCalc(run.recordedFallTimeS, 2);
    case 'velocity':
      return fmtCalc(run.finalVelocityMps, 2);
    case 'gforce':
      return fmtCalc(run.gForce, 2);
    case 'risk':
      return run.riskLabel ?? '—';
  }
}

export function ParachuteResultsTable({
  runs,
  reflection,
  onReflectionChange,
}: ParachuteResultsTableProps) {
  const bestIdx = bestRunIndex(runs);
  const tableWidth = COLUMNS.reduce((sum, col) => sum + col.width, 0);

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
    table: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radii.md,
      overflow: 'hidden' as const,
      minWidth: tableWidth,
    },
    row: {
      flexDirection: 'row' as const,
      minHeight: 44,
    },
    headerRow: {
      backgroundColor: t.colors.readoutBg,
    },
    bestRow: {
      backgroundColor: t.colors.success + '22',
    },
    cell: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.sm,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: t.colors.border,
      justifyContent: 'center' as const,
    },
    headerCell: {
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
      color: t.colors.muted,
      textTransform: 'uppercase' as const,
    },
    bodyCell: {
      fontSize: t.typography.caption,
      color: t.colors.text,
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
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            {COLUMNS.map((col, colIndex) => (
              <View
                key={col.key}
                style={[
                  styles.cell,
                  { width: col.width },
                  colIndex === COLUMNS.length - 1 && { borderRightWidth: 0 },
                ]}
              >
                <Text style={styles.headerCell}>{col.label}</Text>
              </View>
            ))}
          </View>
          {runs.map((run, rowIndex) => {
            const isBest = bestIdx === rowIndex;
            const isLastRow = rowIndex === runs.length - 1;
            return (
              <View key={run.tabKey} style={[styles.row, isBest && styles.bestRow]}>
                {COLUMNS.map((col, colIndex) => (
                  <View
                    key={col.key}
                    style={[
                      styles.cell,
                      { width: col.width },
                      colIndex === COLUMNS.length - 1 && { borderRightWidth: 0 },
                      isLastRow && { borderBottomWidth: 0 },
                    ]}
                  >
                    <Text style={styles.bodyCell}>{cellValue(run, col.key)}</Text>
                    {col.key === 'risk' && isBest ? (
                      <Text style={styles.badge}>Best parachute</Text>
                    ) : null}
                  </View>
                ))}
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
