import { Text, View } from 'react-native';
import type { DominantNonDominantComparison } from '../../lib/reaction/sessionState';
import { useThemedStyles } from '../../theme/themedStyles';

type ReactionComparisonTableProps = {
  memberName: string;
  comparison: DominantNonDominantComparison;
  teamAvgDominant?: number | null;
  teamAvgNonDominant?: number | null;
  fastestDominant?: number | null;
  fastestNonDominant?: number | null;
};

export function ReactionComparisonTable({
  memberName,
  comparison,
  teamAvgDominant,
  teamAvgNonDominant,
  fastestDominant,
  fastestNonDominant,
}: ReactionComparisonTableProps) {
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
      paddingHorizontal: t.spacing.xs,
    },
    row: {
      flexDirection: 'row' as const,
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.xs,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    cell: {
      flex: 1,
      fontSize: 10,
      color: t.colors.text,
    },
    headerCell: {
      flex: 1,
      fontSize: 10,
      fontWeight: '700' as const,
      color: t.colors.muted,
    },
    meta: {
      color: t.colors.muted,
      fontSize: t.typography.caption,
      marginBottom: t.spacing.xs,
    },
  }));

  return (
    <View>
      <Text style={styles.title}>Dominant vs non-dominant hand</Text>
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <Text style={styles.headerCell}>Member</Text>
          <Text style={styles.headerCell}>Dominant</Text>
          <Text style={styles.headerCell}>Non-dom.</Text>
          <Text style={styles.headerCell}>Diff</Text>
          <Text style={styles.headerCell}>% slower</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell}>{memberName}</Text>
          <Text style={styles.cell}>{Math.round(comparison.dominantMs)}</Text>
          <Text style={styles.cell}>{Math.round(comparison.nonDominantMs)}</Text>
          <Text style={styles.cell}>{Math.round(comparison.differenceMs)}</Text>
          <Text style={styles.cell}>{comparison.percentSlower.toFixed(1)}%</Text>
        </View>
      </View>
      {teamAvgDominant != null ? (
        <Text style={styles.meta}>Team avg dominant: {Math.round(teamAvgDominant)} ms</Text>
      ) : null}
      {teamAvgNonDominant != null ? (
        <Text style={styles.meta}>Team avg non-dominant: {Math.round(teamAvgNonDominant)} ms</Text>
      ) : null}
      {fastestDominant != null ? (
        <Text style={styles.meta}>Fastest dominant: {Math.round(fastestDominant)} ms</Text>
      ) : null}
      {fastestNonDominant != null ? (
        <Text style={styles.meta}>Fastest non-dominant: {Math.round(fastestNonDominant)} ms</Text>
      ) : null}
    </View>
  );
}
