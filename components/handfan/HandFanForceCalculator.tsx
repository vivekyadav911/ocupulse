import { Pressable, Text, View } from 'react-native';
import { forceFromStiffness } from '../../lib/calc/handfanForce';
import { STIFFNESS_OPTIONS } from '../../lib/handfan/sessionState';
import { FormField } from '../FormField';
import { StatReadout } from '../StatReadout';
import { useThemedStyles } from '../../theme/themedStyles';

type HandFanForceCalculatorProps = {
  stiffnessK: number;
  stiffnessLabel: string;
  angleDeg: string;
  onStiffnessChange: (k: number, label: string) => void;
  onAngleChange: (v: string) => void;
};

export function HandFanForceCalculator({
  stiffnessK,
  stiffnessLabel,
  angleDeg,
  onStiffnessChange,
  onAngleChange,
}: HandFanForceCalculatorProps) {
  const parsedAngle = Number.parseFloat(angleDeg);
  const forceN =
    Number.isFinite(parsedAngle) && parsedAngle > 0
      ? forceFromStiffness(parsedAngle, stiffnessK)
      : null;
  const thetaRad =
    Number.isFinite(parsedAngle) && parsedAngle > 0
      ? ((parsedAngle * Math.PI) / 180).toFixed(4)
      : '—';

  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
    },
    chipLabel: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.muted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
      marginBottom: t.spacing.xs,
    },
    row: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.sm,
      marginBottom: t.spacing.sm,
    },
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
    chipText: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.text,
    },
    chipTextActive: { color: t.colors.accent },
    formula: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginTop: t.spacing.xs,
      lineHeight: 18,
    },
  }));

  return (
    <View>
      <Text style={styles.title}>Force calculator (optional)</Text>
      <Text style={styles.chipLabel}>Stiffness k</Text>
      <View style={styles.row}>
        {STIFFNESS_OPTIONS.map((opt) => {
          const active = stiffnessK === opt.k;
          return (
            <Pressable
              key={opt.label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onStiffnessChange(opt.k, opt.label)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {opt.label} ({opt.k})
              </Text>
            </Pressable>
          );
        })}
      </View>
      <FormField
        label="Angle θ (°)"
        value={angleDeg}
        onChangeText={onAngleChange}
        keyboardType="decimal-pad"
        placeholder="From last recorded angle"
      />
      <StatReadout
        label="Estimated force"
        value={forceN != null ? `${forceN.toFixed(3)} N` : '—'}
      />
      <Text style={styles.formula}>
        F ≈ k × θ = {stiffnessLabel} ({stiffnessK}) × {thetaRad} rad
        {forceN != null ? ` = ${forceN.toFixed(3)} N` : ''}
      </Text>
    </View>
  );
}
