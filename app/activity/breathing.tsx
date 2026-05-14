import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatReadout } from '../../components/StatReadout';
import { useAccelerometer } from '../../hooks/useAccelerometer';
import { breathsPerMinuteFromPeaks } from '../../lib/calc/breathRate';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { colors, spacing } from '../../theme/tokens';

const WINDOW_S = 30;

export default function BreathingScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const { z } = useAccelerometer();
  const prev = useRef(0);
  const peaks = useRef<number[]>([]);
  const t0 = useRef(Date.now());
  const [bpm, setBpm] = useState(0);
  const [running, setRun] = useState(false);

  useEffect(() => {
    if (!running) return;
    const now = (Date.now() - t0.current) / 1000;
    if (now > WINDOW_S) {
      setRun(false);
      return;
    }
    if (z - prev.current > 0.05 && prev.current < 0) {
      peaks.current.push(now);
    }
    prev.current = z;
    const elapsedForRate = Math.max(now, 1e-6);
    setBpm(breathsPerMinuteFromPeaks(peaks.current, elapsedForRate));
  }, [z, running]);

  const start = () => {
    peaks.current = [];
    t0.current = Date.now();
    setRun(true);
  };

  const save = async () => {
    const sessionId = await writeSessionOptimistic({
      activityType: 'breathing',
      teamName: team,
      score: Math.min(100, bpm * 3),
      payload: { bpm, windowS: WINDOW_S },
    });
    router.push(`/results/${sessionId}`);
  };

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.title}>Breathing Pace Trainer</Text>
        <Text style={styles.p}>Rest phone on chest. Capture ~30 s after calibration.</Text>
        <StatReadout label="Estimated BPM" value={`${bpm.toFixed(1)}`} />
        <Button
          title={running ? 'Recording…' : 'Start 30 s window'}
          onPress={start}
          disabled={running}
        />
        <Button title="Save result" onPress={save} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt },
  title: { fontSize: 22, fontWeight: '800', color: colors.primary, marginBottom: spacing.sm },
  p: { color: colors.muted, marginBottom: spacing.md },
});
