import { Text, View } from 'react-native';
import {
  referenceRowForDb,
  SOUND_REFERENCE_ROWS,
  type SoundReferenceRow,
} from '../lib/calc/soundLevel';
import { useThemedStyles } from '../theme/themedStyles';

type SoundReferenceTableProps = {
  liveDb: number | null;
};

function formatRange(row: SoundReferenceRow): string {
  if (row.maxDb === Infinity) return `${row.minDb}+ dB`;
  return `${row.minDb}–${row.maxDb} dB`;
}

export function SoundReferenceTable({ liveDb }: SoundReferenceTableProps) {
  const activeRow = liveDb != null ? referenceRowForDb(liveDb) : null;

  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '800' as const,
      color: t.colors.text,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
    },
    table: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radii.md,
      overflow: 'hidden' as const,
    },
    row: {
      flexDirection: 'row' as const,
      borderBottomWidth: 1,
      borderColor: t.colors.border,
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.sm,
    },
    activeRow: {
      backgroundColor: t.colors.accent + '22',
      borderLeftWidth: 3,
      borderLeftColor: t.colors.accent,
    },
    headerRow: {
      backgroundColor: t.colors.readoutBg,
    },
    lastRow: {
      borderBottomWidth: 0,
    },
    range: {
      width: 72,
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.muted,
    },
    source: {
      flex: 1,
      fontSize: t.typography.caption,
      fontWeight: '600' as const,
      color: t.colors.text,
      paddingRight: t.spacing.xs,
    },
    risk: {
      flex: 1,
      fontSize: t.typography.caption,
      color: t.colors.muted,
    },
    headerText: {
      fontWeight: '800' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.4,
    },
  }));

  return (
    <View>
      <Text style={styles.title}>Reference levels</Text>
      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.range, styles.headerText]}>Range</Text>
          <Text style={[styles.source, styles.headerText]}>Source</Text>
          <Text style={[styles.risk, styles.headerText]}>Risk</Text>
        </View>
        {SOUND_REFERENCE_ROWS.map((row, index) => {
          const isActive = activeRow?.id === row.id;
          const isLast = index === SOUND_REFERENCE_ROWS.length - 1;
          return (
            <View
              key={row.id}
              style={[styles.row, isActive && styles.activeRow, isLast && styles.lastRow]}
            >
              <Text style={styles.range}>{formatRange(row)}</Text>
              <Text style={styles.source}>{row.source}</Text>
              <Text style={styles.risk}>{row.risk}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
