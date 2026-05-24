import { Text, View } from 'react-native';
import type { EarthquakeReadings } from '../../lib/calc/earthquakeDisplacement';
import type { EarthquakeTestDurationSec } from '../../lib/earthquake/sessionState';
import { StatReadout } from '../StatReadout';
import { Button } from '../Button';
import { EarthquakeRatingBadge } from './EarthquakeRatingBadge';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

type EarthquakeRunResultsProps = {
  readings: EarthquakeReadings;
  testDurationSec: EarthquakeTestDurationSec | null;
  onReplay: () => void;
  replayDisabled?: boolean;
};

export function EarthquakeRunResults({
  readings,
  testDurationSec,
  onReplay,
  replayDisabled,
}: EarthquakeRunResultsProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
    },
    badgeRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
      marginBottom: t.spacing.sm,
    },
    actions: { marginTop: t.spacing.sm },
  }));

  return (
    <View>
      <Text style={styles.title}>Test results</Text>
      <View style={styles.badgeRow}>
        <EarthquakeRatingBadge rating={readings.rating} />
        <Text style={{ fontSize: 14, color: colors.muted }}>
          Peak {readings.peakDisplacementCm.toFixed(2)} cm
        </Text>
      </View>
      <StatReadout
        label="Peak displacement"
        value={`${readings.peakDisplacementCm.toFixed(2)} cm`}
      />
      <StatReadout label="Peak X displacement" value={`${readings.peakXCm.toFixed(2)} cm`} />
      <StatReadout label="Peak Y displacement" value={`${readings.peakYCm.toFixed(2)} cm`} />
      <StatReadout label="Peak Z displacement" value={`${readings.peakZCm.toFixed(2)} cm`} />
      <StatReadout label="Max tilt angle" value={`${readings.maxTiltDeg.toFixed(1)}°`} />
      <StatReadout
        label="Total displacement"
        value={`${readings.totalDisplacementCm.toFixed(2)} cm`}
      />
      <StatReadout
        label="Test duration"
        value={testDurationSec != null ? `${testDurationSec} s` : '—'}
      />
      <StatReadout label="Samples recorded" value={`${readings.sampleCount}`} />
      <View style={styles.actions}>
        <Button title="Replay" variant="secondary" onPress={onReplay} disabled={replayDisabled} />
      </View>
    </View>
  );
}
