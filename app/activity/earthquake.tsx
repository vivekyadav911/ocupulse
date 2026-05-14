import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatReadout } from '../../components/StatReadout';
import { useAccelerometer } from '../../hooks/useAccelerometer';
import { wobbleScoreFromRms } from '../../lib/calc/wobble';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { colors, spacing } from '../../theme/tokens';

const SHAKE_MS = 5000;

export default function EarthquakeScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const { magnitude } = useAccelerometer();
  const [samples, setSamples] = useState<number[]>([]);
  const [phase, setPhase] = useState<'idle' | 'go'>('idle');
  const hapticTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== 'go') return;
    setSamples((s) => [...s.slice(-500), magnitude * 9.81]);
  }, [magnitude, phase]);

  const start = () => {
    setSamples([]);
    setPhase('go');
    let i = 0;
    hapticTimer.current = setInterval(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      i += 1;
      if (i > 120 && hapticTimer.current) clearInterval(hapticTimer.current);
    }, 40);
    setTimeout(() => {
      if (hapticTimer.current) clearInterval(hapticTimer.current);
      setPhase('idle');
    }, SHAKE_MS);
  };

  const mean = samples.reduce((a, b) => a + b, 0) / (samples.length || 1);
  const rms = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / (samples.length || 1));
  const score = wobbleScoreFromRms(rms / 9.81);

  const save = async () => {
    const sessionId = await writeSessionOptimistic({
      activityType: 'earthquake',
      teamName: team,
      score,
      payload: { rmsMs2: rms, sampleCount: samples.length },
    });
    router.push(`/results/${sessionId}`);
  };

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.title}>Earthquake Structure</Text>
        <StatReadout label="Stability score (inverse wobble)" value={`${score}`} />
        <StatReadout label="Approx RMS (m/s²)" value={`${rms.toFixed(2)}`} />
        <Button
          title={phase === 'go' ? 'Shaking…' : 'Vibrate & record 5 s'}
          onPress={start}
          disabled={phase === 'go'}
        />
        <Button title="Save result" onPress={save} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt },
  title: { fontSize: 22, fontWeight: '800', marginBottom: spacing.md, color: colors.primary },
});
