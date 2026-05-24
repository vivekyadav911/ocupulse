import { Pressable, Text, View } from 'react-native';
import {
  DESIGNS,
  DISTANCES_CM,
  MATERIALS,
  materialLabel,
  type HandfanDesign,
  type HandfanDistanceCm,
  type HandfanMaterial,
} from '../../lib/handfan/sessionState';
import { FormField } from '../FormField';
import { useThemedStyles } from '../../theme/themedStyles';

type HandFanTrialSelectorsProps = {
  material: HandfanMaterial;
  design: HandfanDesign;
  distanceCm: HandfanDistanceCm;
  predictedAngleDeg: string;
  onMaterialChange: (m: HandfanMaterial) => void;
  onDesignChange: (d: HandfanDesign) => void;
  onDistanceChange: (d: HandfanDistanceCm) => void;
  onPredictedChange: (v: string) => void;
};

function ChipPicker<T extends string | number>({
  label,
  options,
  value,
  onChange,
  formatLabel,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  formatLabel?: (v: T) => string;
}) {
  const styles = useThemedStyles((t) => ({
    wrap: { marginVertical: t.spacing.xs },
    chipLabel: {
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
    chipText: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.text,
    },
    chipTextActive: { color: t.colors.accent },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.chipLabel}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const active = value === opt;
          const text = formatLabel ? formatLabel(opt) : String(opt);
          return (
            <Pressable
              key={String(opt)}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(opt)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{text}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function HandFanTrialSelectors({
  material,
  design,
  distanceCm,
  predictedAngleDeg,
  onMaterialChange,
  onDesignChange,
  onDistanceChange,
  onPredictedChange,
}: HandFanTrialSelectorsProps) {
  return (
    <View>
      <ChipPicker
        label="Material"
        options={MATERIALS}
        value={material}
        onChange={onMaterialChange}
        formatLabel={(m) => materialLabel(m as HandfanMaterial)}
      />
      <ChipPicker
        label="Fan design"
        options={DESIGNS}
        value={design}
        onChange={onDesignChange}
        formatLabel={(d) => `Design ${d}`}
      />
      <ChipPicker
        label="Distance"
        options={DISTANCES_CM}
        value={distanceCm}
        onChange={onDistanceChange}
        formatLabel={(d) => `${d} cm`}
      />
      <FormField
        label="Predicted bend angle (°)"
        value={predictedAngleDeg}
        onChangeText={onPredictedChange}
        keyboardType="decimal-pad"
        placeholder="e.g. 15"
      />
    </View>
  );
}
