import { Pressable, Text, View } from 'react-native';
import { useThemedStyles } from '../theme/themedStyles';

type AuthRoleToggleProps<T extends string> = {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function AuthRoleToggle<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: AuthRoleToggleProps<T>) {
  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row' as const,
      backgroundColor: t.colors.surface,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 4,
      marginBottom: t.spacing.md,
    },
    option: {
      flex: 1,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radii.sm,
      alignItems: 'center' as const,
    },
    optionOn: {
      backgroundColor: t.colors.primaryButton,
    },
    label: {
      fontWeight: '700',
      fontSize: t.typography.caption,
      color: t.colors.muted,
    },
    labelOn: {
      color: t.colors.textInverse,
    },
  }));

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const on = value === option.value;
        return (
          <Pressable
            key={option.value}
            style={[styles.option, on && styles.optionOn]}
            onPress={() => onChange(option.value)}
            disabled={disabled}
          >
            <Text style={[styles.label, on && styles.labelOn]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
