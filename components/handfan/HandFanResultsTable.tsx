import { ScrollView, Text, TextInput, View } from 'react-native';
import { trialsAsArray, type HandfanTrial } from '../../lib/handfan/sessionState';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

type HandFanResultsTableProps = {
  trials: Record<string, HandfanTrial>;
  onNotesChange: (
    design: HandfanTrial['design'],
    distanceCm: HandfanTrial['distanceCm'],
    notes: string,
  ) => void;
};

const COLUMNS = [
  { key: 'design', label: 'Design', width: 64 },
  { key: 'distance', label: 'Distance', width: 72 },
  { key: 'predicted', label: 'Predicted °', width: 88 },
  { key: 'actual', label: 'Actual °', width: 72 },
  { key: 'notes', label: 'Observation notes', width: 160 },
] as const;

export function HandFanResultsTable({ trials, onNotesChange }: HandFanResultsTableProps) {
  const { colors } = useAppTheme();
  const rows = trialsAsArray(trials);
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
    notesInput: {
      fontSize: t.typography.caption,
      color: t.colors.text,
      padding: 0,
      minHeight: 36,
    },
  }));

  return (
    <View>
      <Text style={styles.sectionTitle}>Results</Text>
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
          {rows.map((trial, rowIndex) => {
            const isLastRow = rowIndex === rows.length - 1;
            return (
              <View key={`${trial.design}-${trial.distanceCm}`} style={styles.row}>
                <View style={[styles.cell, { width: COLUMNS[0].width }]}>
                  <Text style={styles.bodyCell}>{trial.design}</Text>
                </View>
                <View style={[styles.cell, { width: COLUMNS[1].width }]}>
                  <Text style={styles.bodyCell}>{trial.distanceCm} cm</Text>
                </View>
                <View style={[styles.cell, { width: COLUMNS[2].width }]}>
                  <Text style={styles.bodyCell}>{trial.predictedAngleDeg.trim() || '—'}</Text>
                </View>
                <View style={[styles.cell, { width: COLUMNS[3].width }]}>
                  <Text style={styles.bodyCell}>
                    {trial.actualAngleDeg != null ? `${trial.actualAngleDeg}°` : '—'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.cell,
                    { width: COLUMNS[4].width },
                    { borderRightWidth: 0 },
                    isLastRow && { borderBottomWidth: 0 },
                  ]}
                >
                  <TextInput
                    value={trial.observationNotes}
                    onChangeText={(text) => onNotesChange(trial.design, trial.distanceCm, text)}
                    placeholder="Notes…"
                    placeholderTextColor={colors.muted}
                    style={styles.notesInput}
                    multiline
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
