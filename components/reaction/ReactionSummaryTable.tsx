import { Text, View } from 'react-native';
import { useThemedStyles } from '../../theme/themedStyles';

export type SummaryTableRow = {
  member: string;
  reactionMs: number;
  rank: number;
};

type ReactionSummaryTableProps = {
  rows: SummaryTableRow[];
  teamAvg?: number | null;
  fastest?: number | null;
};

export function ReactionSummaryTable({ rows, teamAvg, fastest }: ReactionSummaryTableProps) {
  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    table: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radii.md,
      overflow: 'hidden' as const,
      marginBottom: t.spacing.md,
    },
    headerRow: {
      flexDirection: 'row' as const,
      backgroundColor: t.colors.readoutBg,
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.sm,
    },
    row: {
      flexDirection: 'row' as const,
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    cell: {
      flex: 1,
      fontSize: t.typography.caption,
      color: t.colors.text,
    },
    headerCell: {
      flex: 1,
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.muted,
    },
    meta: {
      color: t.colors.muted,
      fontSize: t.typography.caption,
      marginBottom: t.spacing.sm,
    },
  }));

  return (
    <View>
      <Text style={styles.title}>Phase 1 summary</Text>
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <Text style={styles.headerCell}>Member</Text>
          <Text style={styles.headerCell}>Reaction (ms)</Text>
          <Text style={styles.headerCell}>Rank</Text>
        </View>
        {rows.map((row) => (
          <View key={row.member} style={styles.row}>
            <Text style={styles.cell}>{row.member}</Text>
            <Text style={styles.cell}>{Math.round(row.reactionMs)}</Text>
            <Text style={styles.cell}>{row.rank}</Text>
          </View>
        ))}
      </View>
      {teamAvg != null ? (
        <Text style={styles.meta}>Team average: {Math.round(teamAvg)} ms</Text>
      ) : null}
      {fastest != null ? <Text style={styles.meta}>Fastest: {Math.round(fastest)} ms</Text> : null}
    </View>
  );
}
