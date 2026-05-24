import { ScrollView, Text, View } from 'react-native';
import { ratingLabel } from '../../lib/calc/earthquakeDisplacement';
import { runsAsArray, type EarthquakeDesignRun } from '../../lib/earthquake/sessionState';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

const COLUMNS = [
  { key: 'design', label: 'Design', width: 64 },
  { key: 'folds', label: 'Folds', width: 56 },
  { key: 'pillars', label: 'Pillars', width: 64 },
  { key: 'predicted', label: 'Predicted', width: 72 },
  { key: 'peak', label: 'Peak cm', width: 72 },
  { key: 'tilt', label: 'Tilt °', width: 56 },
  { key: 'rating', label: 'Rating', width: 80 },
] as const;

type EarthquakeResultsTableProps = {
  runs: Record<1 | 2 | 3, EarthquakeDesignRun>;
};

export function EarthquakeResultsTable({ runs }: EarthquakeResultsTableProps) {
  const { colors } = useAppTheme();
  const rows = runsAsArray(runs).filter((r) => r.readings != null);
  const tableWidth = COLUMNS.reduce((sum, col) => sum + col.width, 0);

  const styles = useThemedStyles((t) => ({
    sectionTitle: {
      fontSize: t.typography.subtitle,
      fontWeight: '800' as const,
      color: t.colors.text,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
    },
    empty: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.md,
    },
    tableScroll: { marginBottom: t.spacing.md },
    table: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radii.md,
      overflow: 'hidden' as const,
      minWidth: tableWidth,
    },
    row: { flexDirection: 'row' as const, minHeight: 44 },
    headerRow: { backgroundColor: t.colors.readoutBg },
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
  }));

  if (rows.length === 0) {
    return (
      <View>
        <Text style={styles.sectionTitle}>Results table</Text>
        <Text style={styles.empty}>Complete a design test to see results.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Results table</Text>
      <ScrollView horizontal style={styles.tableScroll} showsHorizontalScrollIndicator>
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            {COLUMNS.map((col) => (
              <View key={col.key} style={[styles.cell, { width: col.width }]}>
                <Text style={styles.headerCell}>{col.label}</Text>
              </View>
            ))}
          </View>
          {rows.map((run) => {
            const r = run.readings!;
            return (
              <View key={run.design} style={styles.row}>
                <View style={[styles.cell, { width: COLUMNS[0].width }]}>
                  <Text style={styles.bodyCell}>D{run.design}</Text>
                </View>
                <View style={[styles.cell, { width: COLUMNS[1].width }]}>
                  <Text style={styles.bodyCell}>{run.folds || '—'}</Text>
                </View>
                <View style={[styles.cell, { width: COLUMNS[2].width }]}>
                  <Text style={styles.bodyCell}>{run.pillars || '—'}</Text>
                </View>
                <View style={[styles.cell, { width: COLUMNS[3].width }]}>
                  <Text style={styles.bodyCell}>{run.predictedMovement ?? '—'}</Text>
                </View>
                <View style={[styles.cell, { width: COLUMNS[4].width }]}>
                  <Text style={styles.bodyCell}>{r.peakDisplacementCm.toFixed(2)}</Text>
                </View>
                <View style={[styles.cell, { width: COLUMNS[5].width }]}>
                  <Text style={styles.bodyCell}>{r.maxTiltDeg.toFixed(1)}</Text>
                </View>
                <View style={[styles.cell, { width: COLUMNS[6].width }]}>
                  <Text style={[styles.bodyCell, { color: colors.accent }]}>
                    {ratingLabel(r.rating)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
