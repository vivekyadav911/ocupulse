import { Pressable, Text, View } from 'react-native';
import type { HandUsed } from '../../lib/reaction/sessionState';
import { useThemedStyles } from '../../theme/themedStyles';

type HandSelectorProps = {
  value: HandUsed;
  onChange: (hand: HandUsed) => void;
  disabled?: boolean;
};

export function HandSelector({ value, onChange, disabled }: HandSelectorProps) {
  const styles = useThemedStyles((t) => ({
    label: {
      fontSize: t.typography.body,
      fontWeight: '600' as const,
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    row: {
      flexDirection: 'row' as const,
      gap: t.spacing.sm,
      marginBottom: t.spacing.md,
    },
    chip: {
      flex: 1,
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center' as const,
    },
    chipActive: {
      borderColor: t.colors.accent,
      backgroundColor: t.colors.accentMuted,
    },
    chipText: {
      fontWeight: '700' as const,
      color: t.colors.text,
    },
    chipTextActive: {
      color: t.colors.accent,
    },
  }));

  return (
    <View>
      <Text style={styles.label}>Which hand are you using?</Text>
      <View style={styles.row}>
        {(['left', 'right'] as const).map((hand) => {
          const active = value === hand;
          return (
            <Pressable
              key={hand}
              style={[styles.chip, active && styles.chipActive]}
              disabled={disabled}
              onPress={() => onChange(hand)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {hand === 'left' ? 'Left' : 'Right'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
