import { Text, View } from 'react-native';
import type {
  EarthquakeDesign,
  EarthquakeTestDurationSec,
} from '../../lib/earthquake/sessionState';
import { Button } from '../Button';
import { EarthquakeDurationPicker } from './EarthquakeDurationPicker';
import { useThemedStyles } from '../../theme/themedStyles';

type EarthquakeSimulatorPanelProps = {
  phase: 'idle' | 'running' | 'done';
  secsLeft: number;
  progress: number;
  testDurationSec: EarthquakeTestDurationSec;
  activeDesign: EarthquakeDesign;
  onDurationChange: (sec: EarthquakeTestDurationSec) => void;
  onStart: () => void;
  disabled?: boolean;
};

function buttonTitle(phase: EarthquakeSimulatorPanelProps['phase'], secsLeft: number): string {
  if (phase === 'running') {
    return secsLeft <= 1 ? 'Finishing…' : `Earthquake — ${secsLeft}s`;
  }
  if (phase === 'done') {
    return 'Run again';
  }
  return 'Start Earthquake';
}

export function EarthquakeSimulatorPanel({
  phase,
  secsLeft,
  progress,
  testDurationSec,
  activeDesign,
  onDurationChange,
  onStart,
  disabled,
}: EarthquakeSimulatorPanelProps) {
  // iOS accessibility requires integer progress values (floats crash HostFunction).
  const pct = Math.round(Math.max(0, Math.min(100, progress * 100)));
  const styles = useThemedStyles((t) => ({
    designStep: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.accent,
      marginBottom: t.spacing.sm,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
    },
    track: {
      height: 10,
      borderRadius: t.radii.md,
      backgroundColor: t.colors.readoutBg,
      borderWidth: 1,
      borderColor: t.colors.border,
      overflow: 'hidden' as const,
      marginBottom: t.spacing.md,
    },
    fill: {
      height: '100%' as const,
      backgroundColor: t.colors.accent,
      borderRadius: t.radii.md,
    },
    hint: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.md,
      lineHeight: 18,
    },
    doneHint: {
      fontSize: t.typography.caption,
      color: t.colors.success,
      marginBottom: t.spacing.sm,
      fontWeight: '600' as const,
    },
  }));

  return (
    <View>
      <Text style={styles.designStep}>Design {activeDesign} of 3</Text>

      <Text style={styles.hint}>
        Place the phone on your model. The vibration pattern runs while the accelerometer records
        movement.
      </Text>

      <EarthquakeDurationPicker
        value={testDurationSec}
        onChange={onDurationChange}
        disabled={disabled || phase === 'running'}
      />

      {phase === 'done' ? (
        <Text style={styles.doneHint}>
          Test complete — review results below, then continue with the next design.
        </Text>
      ) : null}

      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: pct }}
      >
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>

      <Button
        title={buttonTitle(phase, secsLeft)}
        onPress={onStart}
        disabled={phase === 'running' || disabled}
        accessibilityLiveRegion="polite"
      />
    </View>
  );
}
