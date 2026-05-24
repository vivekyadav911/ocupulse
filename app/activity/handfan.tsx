import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { StatReadout } from '../../components/StatReadout';
import { useHandfanSampler } from '../../hooks/useHandfanSampler';
import { bendAngleFromShiftPixels } from '../../lib/calc/bendAngle';
import { shiftPxFromAccelSwing } from '../../lib/calc/handfanMotion';
import { showAlert } from '../../lib/alert';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

export default function HandFanScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const styles = useThemedStyles(activityScreenStyles);
  const { sampling, peakDeviation, startSample, sampleMs } = useHandfanSampler();

  const shiftPx = shiftPxFromAccelSwing(peakDeviation);
  const angle = bendAngleFromShiftPixels(shiftPx);

  const save = async () => {
    if (peakDeviation <= 0) {
      showAlert('No fan motion', 'Wave the fan for 5 s first, then save.');
      return;
    }
    try {
      const sessionId = await writeSessionOptimistic({
        activityType: 'handfan',
        teamName: team,
        score: angle,
        payload: {
          bendAngleDeg: angle,
          shiftPx,
          peakDeviationG: peakDeviation,
          sampleMs,
        },
      });
      router.push(`/results/${sessionId}`);
    } catch (e) {
      showAlert('Could not save', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <ExperimentScreen>
      <ActivityCard title="Hand Fan" live={sampling}>
        <Text style={styles.p}>
          Hold the phone and wave your fan for 5 s — accelerometer motion estimates bend angle.
        </Text>
        <StatReadout
          label="Motion (peak Δ g)"
          value={sampling ? 'Sampling…' : peakDeviation > 0 ? peakDeviation.toFixed(3) : '—'}
        />
        <StatReadout label="Estimated angle" value={angle > 0 ? `${angle}°` : '—'} />
        <View style={styles.actions}>
          <Button
            title={sampling ? 'Waving 5 s…' : 'Wave fan 5 s'}
            onPress={startSample}
            disabled={sampling}
          />
          <Button
            title="Save result"
            onPress={() => void save()}
            disabled={sampling || angle <= 0}
          />
          <Button title="Home" variant="secondary" onPress={() => router.back()} />
        </View>
      </ActivityCard>
    </ExperimentScreen>
  );
}
