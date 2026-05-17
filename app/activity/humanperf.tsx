import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatReadout } from '../../components/StatReadout';
import { useGyroscope } from '../../hooks/useGyroscope';
import { smoothnessScore } from '../../lib/calc/smoothness';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { colors, spacing } from '../../theme/tokens';

export default function HumanPerfScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
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
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.title}>Human Performance Lab</Text>
        <StatReadout label="Smoothness score (lower jerk = higher)" value={`${score}`} />
        <Text style={styles.p}>
          Move your arm smoothly — gyroscope samples update continuously.
        </Text>
        <Button title="Save result" onPress={save} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt },
  title: { fontSize: 22, fontWeight: '800', marginBottom: spacing.md, color: colors.primary },
  p: { color: colors.muted, marginBottom: spacing.md },
});
