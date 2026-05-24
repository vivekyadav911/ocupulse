import { Pressable, Text, View } from 'react-native';
import type { SoundPrediction } from '../lib/calc/soundLevel';
import { useThemedStyles } from '../theme/themedStyles';

type SoundPredictionPickerProps = {
  value: SoundPrediction | null;
  onChange: (value: SoundPrediction) => void;
  disabled: boolean;
};

const OPTIONS: { value: SoundPrediction; label: string }[] = [
  { value: 'louder', label: 'Louder than previous' },
  { value: 'softer', label: 'Softer than previous' },
];

export function SoundPredictionPicker({ value, onChange, disabled }: SoundPredictionPickerProps) {
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
    row: { flexDirection: 'row' as const, gap: t.spacing.sm },
    chip: {
      flex: 1,
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
      textAlign: 'center' as const,
    },
    chipTextActive: { color: t.colors.accent },
    hint: {
      marginTop: t.spacing.xs,
      fontSize: t.typography.caption,
      color: t.colors.muted,
      lineHeight: 18,
    },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Prediction (before capture)</Text>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}
              disabled={disabled}
              onPress={() => onChange(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active, disabled }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>
        {disabled
          ? 'First capture has no previous reading — prediction is N/A.'
          : 'Required before each new capture — choose louder or softer than your last reading.'}
      </Text>
    </View>
  );
}
