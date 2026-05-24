import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { StatReadout } from '../../components/StatReadout';
import { useBreathingMonitor } from '../../hooks/useBreathingMonitor';
import { showAlert } from '../../lib/alert';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

export default function BreathingScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const styles = useThemedStyles(activityScreenStyles);
  const { running, bpm, peakTimesS, progress, start, reset } = useBreathingMonitor();

  const save = async () => {
    if (peakTimesS.length < 2) {
      showAlert(
        'Not enough data',
        'Complete the 30 s window with at least two breath peaks detected.',
      );
      return;
    }
    try {
      const sessionId = await writeSessionOptimistic({
        activityType: 'breathing',
        teamName: team,
        score: Math.round(bpm),
        payload: { bpm, windowS: 30, peakCount: peakTimesS.length },
      });
      router.push(`/results/${sessionId}`);
    } catch (e) {
      showAlert('Could not save', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <ExperimentScreen>
      <ActivityCard title="Breathing Pace Trainer" live={running}>
        <StatReadout
          label="Breaths / min (Z-axis peaks)"
          value={running || peakTimesS.length ? `${bpm}` : '—'}
        />
        <StatReadout
          label="Peaks detected"
          value={
            running ? `${peakTimesS.length}` : peakTimesS.length ? `${peakTimesS.length}` : '—'
          }
        />
        <StatReadout
          label="Window progress"
          value={running ? `${Math.round(progress * 100)}%` : '—'}
        />
        <Text style={styles.p}>
          Place the phone on your chest. Start the 30 s window and breathe steadily — we track
          vertical motion from the accelerometer.
        </Text>
        <View style={styles.actions}>
          <Button
            title={running ? 'Recording 30 s…' : 'Start 30 s window'}
            onPress={start}
            disabled={running}
          />
          <Button
            title="Save result"
            onPress={() => void save()}
            disabled={running || peakTimesS.length < 2}
          />
          <Button title="Reset" variant="secondary" onPress={reset} disabled={running} />
          <Button title="Home" variant="secondary" onPress={() => router.back()} />
        </View>
      </ActivityCard>
    </ExperimentScreen>
  );
}
