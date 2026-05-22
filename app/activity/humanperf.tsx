import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { StatReadout } from '../../components/StatReadout';
import { useGyroscope } from '../../hooks/useGyroscope';
import { smoothnessScore } from '../../lib/calc/smoothness';
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

  const save = async () => {
    const sessionId = await writeSessionOptimistic({
      activityType: 'humanperf',
      teamName: team,
      score,
      payload: { sampleCount: series.length },
    });
    router.push(`/results/${sessionId}`);
  };

  return (
    <ExperimentScreen>
      <ActivityCard title="Human Performance Lab" live>
        <StatReadout label="Smoothness score (lower jerk = higher)" value={`${score}`} />
        <Text style={styles.p}>
          Move your arm smoothly — gyroscope samples update continuously.
        </Text>
        <View style={styles.actions}>
          <Button title="Save result" onPress={save} />
          <Button title="Home" variant="secondary" onPress={() => router.back()} />
        </View>
      </ActivityCard>
    </ExperimentScreen>
  );
}
