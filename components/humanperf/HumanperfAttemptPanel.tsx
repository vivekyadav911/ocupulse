import { Text, View } from 'react-native';
import type { HumanperfAttempt } from '../../lib/humanperf/sessionState';
import { Button } from '../Button';
import { StatReadout } from '../StatReadout';
import { HumanperfRatingBadge } from './HumanperfRatingBadge';
import { useThemedStyles } from '../../theme/themedStyles';

type HumanperfAttemptPanelProps = {
  phase: 'idle' | 'recording' | 'attemptDone';
  secsLeft: number;
  progress: number;
  attemptDurationSec: number;
  currentAttempt: HumanperfAttempt | null;
  recordingDisabled?: boolean;
  onStart: () => void;
  onStop: () => void;
  onRetry: () => void;
  onNextMovement: () => void;
  canAdvance: boolean;
};

export function HumanperfAttemptPanel({
  phase,
  secsLeft,
  progress,
  attemptDurationSec,
  currentAttempt,
  recordingDisabled,
  onStart,
  onStop,
  onRetry,
  onNextMovement,
  canAdvance,
}: HumanperfAttemptPanelProps) {
  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
    },
    timer: {
      fontSize: t.typography.title,
      fontWeight: '800' as const,
      color: t.colors.accent,
      textAlign: 'center' as const,
      marginBottom: t.spacing.sm,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: t.colors.readoutBg,
      marginBottom: t.spacing.md,
      overflow: 'hidden' as const,
    },
    progressFill: {
      height: '100%' as const,
      backgroundColor: t.colors.accent,
    },
    badgeRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
      marginBottom: t.spacing.sm,
    },
    actions: { gap: t.spacing.sm, marginTop: t.spacing.sm },
  }));

  return (
    <View>
      <Text style={styles.title}>Timed attempt ({attemptDurationSec} s)</Text>

      {phase === 'recording' ? (
        <>
          <Text style={styles.timer}>{secsLeft}s remaining</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Button title="Stop" variant="secondary" onPress={onStop} />
        </>
      ) : null}

      {phase === 'idle' ? (
        <View style={styles.actions}>
          <Button title="Start attempt" onPress={onStart} disabled={recordingDisabled} />
        </View>
      ) : null}

      {phase === 'attemptDone' && currentAttempt ? (
        <>
          <Text style={styles.title}>Attempt results</Text>
          <View style={styles.badgeRow}>
            <HumanperfRatingBadge rating={currentAttempt.smoothnessRating} />
          </View>
          <StatReadout label="Average jerk" value={`${currentAttempt.avgJerkMm.toFixed(1)} mm`} />
          <StatReadout label="Peak jerk" value={`${currentAttempt.peakJerkMm.toFixed(1)} mm`} />
          <StatReadout label="Duration" value={`${currentAttempt.durationSec.toFixed(1)} s`} />
          <View style={styles.actions}>
            <Button title="Retry attempt" variant="secondary" onPress={onRetry} />
            {canAdvance ? <Button title="Next movement" onPress={onNextMovement} /> : null}
          </View>
        </>
      ) : null}
    </View>
  );
}
