import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatReadout } from '../../components/StatReadout';
import { useAccelerometer } from '../../hooks/useAccelerometer';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

export default function BreathingScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const { magnitude } = useAccelerometer();
  const styles = useThemedStyles(activityScreenStyles);

  const save = async () => {
    const sessionId = await writeSessionOptimistic({
      activityType: 'breathing',
      teamName: team,
      score: Math.min(100, Math.round(magnitude * 20)),
      payload: { chestMag: magnitude },
    });
    router.push(`/results/${sessionId}`);
  };

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.title}>Breathing Pace Trainer</Text>
        <StatReadout label="Chest Z magnitude (stub)" value={`${magnitude.toFixed(3)}`} />
        <Text style={styles.p}>Place phone on chest; low-pass Z-axis tracking in Sprint 3.</Text>
        <Button title="Save result" onPress={save} />
        <Button title="Home" variant="secondary" onPress={() => router.back()} />
      </Card>
    </View>
  );
}
