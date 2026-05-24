import { ScrollView, Text, View } from 'react-native';
import type { BreathingTeamMemberRow } from '../../lib/breathing/sessionState';
import { useThemedStyles } from '../../theme/themedStyles';

const COLUMNS = [
  { key: 'member', label: 'Member', width: 88 },
  { key: 'rest', label: 'Rest BPM', width: 72 },
  { key: 'jog', label: 'After jog', width: 72 },
  { key: 'jumps', label: 'Star jumps', width: 80 },
  { key: 'increase', label: 'BPM increase', width: 88 },
] as const;

type BreathingResultsTableProps = {
  rows: BreathingTeamMemberRow[];
  highlightMember?: string | null;
};

export function BreathingResultsTable({ rows, highlightMember }: BreathingResultsTableProps) {
  const tableWidth = COLUMNS.reduce((sum, col) => sum + col.width, 0);

  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
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
    highlightRow: { backgroundColor: '#E8A83822' },
    cell: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.sm,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: t.colors.border,
      justifyContent: 'center' as const,
    },
    headerCell: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: t.colors.muted,
    },
    cellText: {
      fontSize: 10,
      color: t.colors.text,
    },
  }));

  if (rows.length === 0) {
    return (
      <View>
        <Text style={styles.title}>Team results</Text>
        <Text style={styles.empty}>Upload results to compare with your team.</Text>
      </View>
    );
  }

  const fmt = (v: number | null) => (v != null && v > 0 ? v.toFixed(1) : '—');

  return (
    <View>
      <Text style={styles.title}>Team results</Text>
      <ScrollView horizontal style={styles.tableScroll} showsHorizontalScrollIndicator>
        <View style={[styles.table, { width: tableWidth }]}>
          <View style={[styles.row, styles.headerRow]}>
            {COLUMNS.map((col, i) => (
              <View
                key={col.key}
                style={[
                  styles.cell,
                  { width: col.width },
                  i === COLUMNS.length - 1 && { borderRightWidth: 0 },
                ]}
              >
                <Text style={styles.headerCell}>{col.label}</Text>
              </View>
            ))}
          </View>
          {rows.map((row) => {
            const highlight = highlightMember === row.memberName;
            return (
              <View key={row.memberName} style={[styles.row, highlight && styles.highlightRow]}>
                <View style={[styles.cell, { width: COLUMNS[0]!.width }]}>
                  <Text style={styles.cellText}>{row.memberName}</Text>
                </View>
                <View style={[styles.cell, { width: COLUMNS[1]!.width }]}>
                  <Text style={styles.cellText}>{fmt(row.restBpm)}</Text>
                </View>
                <View style={[styles.cell, { width: COLUMNS[2]!.width }]}>
                  <Text style={styles.cellText}>{fmt(row.jogBpm)}</Text>
                </View>
                <View style={[styles.cell, { width: COLUMNS[3]!.width }]}>
                  <Text style={styles.cellText}>{fmt(row.starJumpsBpm)}</Text>
                </View>
                <View style={[styles.cell, { width: COLUMNS[4]!.width, borderRightWidth: 0 }]}>
                  <Text style={styles.cellText}>
                    {row.bpmIncreasePct != null ? `${row.bpmIncreasePct.toFixed(1)}%` : '—'}
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
