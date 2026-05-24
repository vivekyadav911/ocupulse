import { Pressable, Text, View } from 'react-native';
import {
  BREATHING_STATES,
  breathingStateLabel,
  type BreathingStateId,
} from '../../lib/breathing/sessionState';
import { useThemedStyles } from '../../theme/themedStyles';

type BreathingStateSelectorProps = {
  value: BreathingStateId;
  onChange: (state: BreathingStateId) => void;
  completed: Partial<Record<BreathingStateId, unknown>>;
  disabled?: boolean;
};

export function BreathingStateSelector({
  value,
  onChange,
  completed,
  disabled,
}: BreathingStateSelectorProps) {
  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    row: { gap: t.spacing.sm, marginBottom: t.spacing.md },
    chip: {
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
    },
    chipActive: {
      borderColor: t.colors.accent,
      backgroundColor: t.colors.accent + '18',
    },
    chipDone: {
      borderColor: t.colors.success,
    },
    chipDisabled: { opacity: 0.5 },
    label: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.text,
    },
    doneMark: {
      fontSize: t.typography.caption,
      color: t.colors.success,
      marginTop: 2,
    },
  }));

  return (
    <View>
      <Text style={styles.title}>Session state</Text>
      <View style={styles.row}>
        {BREATHING_STATES.map((s) => {
          const isActive = value === s.id;
          const isDone = completed[s.id] != null;
          return (
            <Pressable
              key={s.id}
              style={[
                styles.chip,
                isActive && styles.chipActive,
                isDone && styles.chipDone,
                disabled && styles.chipDisabled,
              ]}
              onPress={() => !disabled && onChange(s.id)}
              disabled={disabled}
            >
              <Text style={styles.label}>{breathingStateLabel(s.id)}</Text>
              {isDone ? <Text style={styles.doneMark}>Recorded ✓</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
