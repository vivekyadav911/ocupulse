import { Pressable, Text, View } from 'react-native';
import { PREDICTED_MOVEMENTS, type PredictedMovement } from '../../lib/earthquake/sessionState';
import { useThemedStyles } from '../../theme/themedStyles';

type EarthquakePredictionPickerProps = {
  value: PredictedMovement | null;
  onChange: (value: PredictedMovement) => void;
  disabled?: boolean;
};

export function EarthquakePredictionPicker({
  value,
  onChange,
  disabled,
}: EarthquakePredictionPickerProps) {
  const styles = useThemedStyles((t) => ({
    wrap: { marginVertical: t.spacing.sm },
    label: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.muted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
      marginBottom: t.spacing.xs,
    },
    row: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: t.spacing.sm },
    chip: {
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.sm,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
    },
    chipActive: {
      borderColor: t.colors.accent,
      backgroundColor: t.colors.accent + '18',
    },
    chipDisabled: { opacity: 0.45 },
    chipText: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.text,
    },
    chipTextActive: { color: t.colors.accent },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Predicted movement</Text>
      <View style={styles.row}>
        {PREDICTED_MOVEMENTS.map((opt) => {
          const active = value === opt;
          return (
            <Pressable
              key={opt}
              style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}
              disabled={disabled}
              onPress={() => onChange(opt)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active, disabled: !!disabled }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
