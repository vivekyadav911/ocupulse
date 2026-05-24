import { Text, View } from 'react-native';
import type { EarthquakeTestDurationSec } from '../../lib/earthquake/sessionState';
import { Button } from '../Button';
import { EarthquakeDurationPicker } from './EarthquakeDurationPicker';
import { useThemedStyles } from '../../theme/themedStyles';

type EarthquakeSimulatorPanelProps = {
  phase: 'idle' | 'running' | 'done';
  secsLeft: number;
  progress: number;
  testDurationSec: EarthquakeTestDurationSec;
  onDurationChange: (sec: EarthquakeTestDurationSec) => void;
  onStart: () => void;
  disabled?: boolean;
};

export function EarthquakeSimulatorPanel({
  phase,
  secsLeft,
  progress,
  testDurationSec,
  onDurationChange,
  onStart,
  disabled,
}: EarthquakeSimulatorPanelProps) {
  const pct = Math.max(0, Math.min(100, progress * 100));
  const styles = useThemedStyles((t) => ({
    countdown: {
      fontSize: t.typography.subtitle,
      fontWeight: '800' as const,
      color: t.colors.accent,
      marginBottom: t.spacing.sm,
      fontFamily: 'monospace',
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
  }));

  return (
    <View>
      <Text style={styles.hint}>
        Place the phone on your model. The vibration pattern runs while the accelerometer records
        movement.
      </Text>

      <EarthquakeDurationPicker
        value={testDurationSec}
        onChange={onDurationChange}
        disabled={disabled || phase === 'running'}
      />

      {phase !== 'idle' ? (
        <Text style={styles.countdown} accessibilityLiveRegion="polite">
          {phase === 'running' ? `${secsLeft}s remaining` : 'Test complete'}
        </Text>
      ) : null}
      <View style={styles.track} accessibilityRole="progressbar">
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Button
        title={phase === 'running' ? 'Earthquake in progress…' : 'Start Earthquake'}
        onPress={onStart}
        disabled={phase === 'running' || disabled}
      />
    </View>
  );
}
