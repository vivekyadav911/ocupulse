import { Pressable, Text, View } from 'react-native';
import {
  DESIGNS,
  DISTANCES_CM,
  trialKey,
  type HandfanDesign,
  type HandfanDistanceCm,
  type HandfanTrial,
} from '../../lib/handfan/sessionState';
import { useThemedStyles } from '../../theme/themedStyles';

type HandFanProgressGridProps = {
  trials: Record<string, HandfanTrial>;
  activeDesign: HandfanDesign;
  activeDistanceCm: HandfanDistanceCm;
  onSelect: (design: HandfanDesign, distanceCm: HandfanDistanceCm) => void;
};

export function HandFanProgressGrid({
  trials,
  activeDesign,
  activeDistanceCm,
  onSelect,
}: HandFanProgressGridProps) {
  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
    },
    headerRow: {
      flexDirection: 'row' as const,
      marginBottom: t.spacing.xs,
      paddingLeft: 48,
    },
    headerCell: {
      flex: 1,
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.muted,
      textAlign: 'center' as const,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: t.spacing.xs,
    },
    rowLabel: {
      width: 48,
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.muted,
    },
    cell: {
      flex: 1,
      marginHorizontal: 2,
      aspectRatio: 1,
      maxHeight: 44,
      borderRadius: t.radii.sm,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    cellComplete: {
      backgroundColor: t.colors.success + '22',
      borderColor: t.colors.success,
    },
    cellActive: {
      borderColor: t.colors.accent,
      borderWidth: 2,
    },
    cellText: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.text,
    },
    cellTextMuted: {
      color: t.colors.muted,
    },
  }));

  return (
    <View>
      <Text style={styles.title}>Progress (3 × 3)</Text>
      <View style={styles.headerRow}>
        {DISTANCES_CM.map((d) => (
          <Text key={d} style={styles.headerCell}>
            {d} cm
          </Text>
        ))}
      </View>
      {DESIGNS.map((design) => (
        <View key={design} style={styles.row}>
          <Text style={styles.rowLabel}>D{design}</Text>
          {DISTANCES_CM.map((distanceCm) => {
            const trial = trials[trialKey(design, distanceCm)];
            const complete = trial?.actualAngleDeg != null;
            const active = design === activeDesign && distanceCm === activeDistanceCm;
            return (
              <Pressable
                key={distanceCm}
                style={[styles.cell, complete && styles.cellComplete, active && styles.cellActive]}
                onPress={() => onSelect(design, distanceCm)}
                accessibilityRole="button"
                accessibilityLabel={`Design ${design}, ${distanceCm} cm`}
              >
                <Text style={[styles.cellText, !complete && styles.cellTextMuted]}>
                  {complete ? `${trial.actualAngleDeg}°` : '—'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
