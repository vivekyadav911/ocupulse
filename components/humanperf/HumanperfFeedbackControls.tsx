import Slider from '@react-native-community/slider';
import { Switch, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

type HumanperfFeedbackControlsProps = {
  enabled: boolean;
  thresholdMm: number;
  onEnabledChange: (v: boolean) => void;
  onThresholdChange: (v: number) => void;
  disabled?: boolean;
};

export function HumanperfFeedbackControls({
  enabled,
  thresholdMm,
  onEnabledChange,
  onThresholdChange,
  disabled,
}: HumanperfFeedbackControlsProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((t) => ({
    wrap: {
      marginVertical: t.spacing.sm,
      padding: t.spacing.md,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.readoutBg,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
    },
    help: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginTop: t.spacing.xs,
      lineHeight: 18,
    },
    sliderLabel: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.muted,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.xs,
    },
    sliderValue: {
      fontSize: t.typography.caption,
      color: t.colors.text,
      textAlign: 'right' as const,
      marginBottom: t.spacing.xs,
    },
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.title}>Vibration feedback</Text>
        <Switch
          value={enabled}
          onValueChange={onEnabledChange}
          disabled={disabled}
          accessibilityLabel="Toggle vibration feedback"
        />
      </View>
      <Text style={styles.help}>
        When on, a soft beep plays whenever jerk exceeds the threshold — try to move more smoothly.
      </Text>
      {enabled ? (
        <>
          <Text style={styles.sliderLabel}>Jerk threshold</Text>
          <Text style={styles.sliderValue}>{thresholdMm.toFixed(0)} mm</Text>
          <Slider
            minimumValue={1}
            maximumValue={50}
            step={1}
            value={thresholdMm}
            onValueChange={onThresholdChange}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
            disabled={disabled}
            accessibilityLabel="Jerk feedback threshold"
          />
        </>
      ) : null}
    </View>
  );
}
