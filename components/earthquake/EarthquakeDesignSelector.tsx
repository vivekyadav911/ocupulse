import { Pressable, Text, View } from 'react-native';
import {
  DESIGNS,
  type EarthquakeDesign,
  type EarthquakeDesignRun,
} from '../../lib/earthquake/sessionState';
import { useThemedStyles } from '../../theme/themedStyles';

type EarthquakeDesignSelectorProps = {
  runs: Record<EarthquakeDesign, EarthquakeDesignRun>;
  activeDesign: EarthquakeDesign;
  onSelect: (design: EarthquakeDesign) => void;
  disabled?: boolean;
};

export function EarthquakeDesignSelector({
  runs,
  activeDesign,
  onSelect,
  disabled,
}: EarthquakeDesignSelectorProps) {
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
      <Text style={styles.title}>Design</Text>
      <View style={styles.row}>
        {DESIGNS.map((d) => {
          const complete = runs[d].readings != null;
          const active = activeDesign === d;
          return (
            <Pressable
              key={d}
              style={[
                styles.chip,
                active && styles.chipActive,
                complete && styles.chipComplete,
                disabled && styles.chipDisabled,
              ]}
              disabled={disabled}
              onPress={() => onSelect(d)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active, disabled: !!disabled }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>Design {d}</Text>
              {complete ? <Text style={styles.doneMark}>Done</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
