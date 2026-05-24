import { ScrollView, Text, View } from 'react-native';
import { formatPredictionCorrect, predictionLabel } from '../lib/calc/soundLevel';
import type { SoundCapture } from '../lib/sound/sessionState';
import { activityScreenStyles } from '../theme/activityScreenStyles';
import { useThemedStyles } from '../theme/themedStyles';

type SoundResultsTableProps = {
  captures: SoundCapture[];
};

const COLUMNS = [
  { key: 'action', label: 'Action label', width: 120 },
  { key: 'prediction', label: 'Prediction', width: 140 },
  { key: 'outcome', label: 'Outcome dB', width: 88 },
  { key: 'correct', label: 'Correct?', width: 72 },
] as const;

function cellValue(capture: SoundCapture, key: (typeof COLUMNS)[number]['key']): string {
  switch (key) {
    case 'action':
      return capture.actionLabel;
    case 'prediction':
      return predictionLabel(capture.prediction);
    case 'outcome':
      return `${Math.round(capture.peakDb)} dB`;
    case 'correct':
      return formatPredictionCorrect(capture.predictionCorrect);
  }
}

export function SoundResultsTable({ captures }: SoundResultsTableProps) {
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
    empty: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.md,
      lineHeight: 18,
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

  if (captures.length === 0) {
    return (
      <View>
        <Text style={styles.sectionTitle}>Captured readings</Text>
        <Text style={styles.empty}>
          No readings yet — use Capture reading to log an action with its peak dB.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Captured readings</Text>
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
          {captures.map((capture, rowIndex) => {
            const isLastRow = rowIndex === captures.length - 1;
            return (
              <View key={capture.id} style={styles.row}>
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
                    <Text style={styles.bodyCell}>{cellValue(capture, col.key)}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
