import { Pressable, Text, View } from 'react-native';
import {
  TEST_DURATIONS_SEC,
  type EarthquakeTestDurationSec,
} from '../../lib/earthquake/sessionState';
import { useThemedStyles } from '../../theme/themedStyles';

type EarthquakeDurationPickerProps = {
  value: EarthquakeTestDurationSec;
  onChange: (value: EarthquakeTestDurationSec) => void;
  disabled?: boolean;
};

export function EarthquakeDurationPicker({
  value,
  onChange,
  disabled,
}: EarthquakeDurationPickerProps) {
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
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      alignItems: 'center' as const,
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
    hint: {
      marginTop: t.spacing.xs,
      fontSize: t.typography.caption,
      color: t.colors.muted,
      lineHeight: 18,
    },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Test duration</Text>
      <View style={styles.row}>
        {TEST_DURATIONS_SEC.map((sec) => {
          const active = value === sec;
          return (
            <Pressable
              key={sec}
              style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}
              disabled={disabled}
              onPress={() => onChange(sec)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active, disabled: !!disabled }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{sec} s</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>
        Vibration and accelerometer recording run for the selected duration.
      </Text>
    </View>
  );
}
