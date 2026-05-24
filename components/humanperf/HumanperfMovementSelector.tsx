import { Pressable, Text, View } from 'react-native';
import {
  MOVEMENTS,
  type HumanperfMovementId,
  type HumanperfSessionState,
} from '../../lib/humanperf/sessionState';
import { useThemedStyles } from '../../theme/themedStyles';

type HumanperfMovementSelectorProps = {
  attempts: HumanperfSessionState['attempts'];
  activeMovement: HumanperfMovementId;
  onSelect: (movement: HumanperfMovementId) => void;
  disabled?: boolean;
};

export function HumanperfMovementSelector({
  attempts,
  activeMovement,
  onSelect,
  disabled,
}: HumanperfMovementSelectorProps) {
  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginBottom: t.spacing.sm,
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
    chipComplete: { borderColor: t.colors.success },
    chipDisabled: { opacity: 0.5 },
    chipText: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.text,
      textAlign: 'center' as const,
    },
    chipTextActive: { color: t.colors.accent },
    doneMark: {
      fontSize: 10,
      color: t.colors.success,
      fontWeight: '800' as const,
      marginTop: 2,
    },
  }));

  return (
    <View>
      <Text style={styles.title}>Movement</Text>
      <View style={styles.row}>
        {MOVEMENTS.map((m) => {
          const complete = attempts[m.id] != null;
          const active = activeMovement === m.id;
          return (
            <Pressable
              key={m.id}
              style={[
                styles.chip,
                active && styles.chipActive,
                complete && styles.chipComplete,
                disabled && styles.chipDisabled,
              ]}
              disabled={disabled}
              onPress={() => onSelect(m.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active, disabled: !!disabled }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {m.id}. {m.label}
              </Text>
              {complete ? <Text style={styles.doneMark}>Done</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
