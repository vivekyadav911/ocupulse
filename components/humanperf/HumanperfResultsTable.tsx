import { ScrollView, Text, View } from 'react-native';
import { movementLabel } from '../../lib/humanperf/sessionState';
import type { HumanperfAttempt, HumanperfMovementId } from '../../lib/humanperf/sessionState';
import { useThemedStyles } from '../../theme/themedStyles';
import { HumanperfRatingBadge } from './HumanperfRatingBadge';

const COLUMNS = [
  { key: 'movement', label: 'Movement', width: 88 },
  { key: 'avg', label: 'Avg jerk', width: 72 },
  { key: 'peak', label: 'Peak jerk', width: 72 },
  { key: 'duration', label: 'Duration', width: 72 },
  { key: 'rating', label: 'Rating', width: 88 },
] as const;

type HumanperfResultsTableProps = {
  attempts: Record<HumanperfMovementId, HumanperfAttempt | null>;
};

export function HumanperfResultsTable({ attempts }: HumanperfResultsTableProps) {
  const rows = ([1, 2, 3] as const)
    .map((id) => attempts[id])
    .filter((a): a is HumanperfAttempt => a != null);
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
    },
    cellText: {
      fontSize: t.typography.caption,
      color: t.colors.text,
    },
  }));

  if (rows.length === 0) {
    return (
      <View>
        <Text style={styles.sectionTitle}>Results</Text>
        <Text style={styles.empty}>Complete a movement attempt to see results.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Results</Text>
      <ScrollView horizontal style={styles.tableScroll} showsHorizontalScrollIndicator>
        <View style={[styles.table, { width: tableWidth }]}>
          <View style={[styles.row, styles.headerRow]}>
            {COLUMNS.map((col) => (
              <View key={col.key} style={[styles.cell, { width: col.width }]}>
                <Text style={styles.headerCell}>{col.label}</Text>
              </View>
            ))}
          </View>
          {rows.map((row) => (
            <View key={row.movement} style={styles.row}>
              <View style={[styles.cell, { width: COLUMNS[0]!.width }]}>
                <Text style={styles.cellText}>{movementLabel(row.movement)}</Text>
              </View>
              <View style={[styles.cell, { width: COLUMNS[1]!.width }]}>
                <Text style={styles.cellText}>{row.avgJerkMm.toFixed(1)} mm</Text>
              </View>
              <View style={[styles.cell, { width: COLUMNS[2]!.width }]}>
                <Text style={styles.cellText}>{row.peakJerkMm.toFixed(1)} mm</Text>
              </View>
              <View style={[styles.cell, { width: COLUMNS[3]!.width }]}>
                <Text style={styles.cellText}>{row.durationSec.toFixed(1)} s</Text>
              </View>
              <View style={[styles.cell, { width: COLUMNS[4]!.width, borderRightWidth: 0 }]}>
                <HumanperfRatingBadge rating={row.smoothnessRating} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
