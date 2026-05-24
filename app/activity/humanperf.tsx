import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { StatReadout } from '../../components/StatReadout';
import { useGyroscope } from '../../hooks/useGyroscope';
import { showAlert } from '../../lib/alert';
import { jerkRmsFromSamples, smoothnessScore } from '../../lib/calc/smoothness';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

export default function HumanPerfScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const styles = useThemedStyles(activityScreenStyles);
  const { series, hz } = useGyroscope();
  const dt = hz > 0 ? 1 / hz : 1 / 60;
  const score = smoothnessScore(series, dt);
  const jerkRms = jerkRmsFromSamples(series, dt);

  const save = async () => {
    if (series.length < 30) {
      showAlert(
        'Keep moving',
        'Move your arm smoothly for a few seconds so the gyroscope can score you.',
      );
      return;
    }
    try {
      const sessionId = await writeSessionOptimistic({
        activityType: 'humanperf',
        teamName: team,
        score,
        payload: { sampleCount: series.length, jerkRms, smoothness: score },
      });
      router.push(`/results/${sessionId}`);
    } catch (e) {
      showAlert('Could not save', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <ExperimentScreen>
      <ActivityCard title="Human Performance Lab" live>
        <StatReadout label="Smoothness score (higher = smoother)" value={`${score}`} />
        <StatReadout label="Gyro jerk RMS" value={series.length ? jerkRms.toFixed(2) : '—'} />
        <Text style={styles.p}>
          Move your arm smoothly — gyroscope samples update continuously ({series.length} samples).
        </Text>
        <View style={styles.actions}>
          <Button title="Save result" onPress={() => void save()} disabled={series.length < 30} />
          <Button title="Home" variant="secondary" onPress={() => router.back()} />
        </View>
      </ActivityCard>
    </ExperimentScreen>
  );
}
