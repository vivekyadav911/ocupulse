import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { StatReadout } from '../../components/StatReadout';
import { useAccelerometer } from '../../hooks/useAccelerometer';
import { useRecordingGate } from '../../hooks/useRecordingGate';
import { magnitudeRms, wobbleScoreFromRms } from '../../lib/calc/wobble';
import { saveActivityResult } from '../../services/activityWrite';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

const SHAKE_MS = 5000;
const HAPTIC_INTERVAL_MS = 40;

export default function EarthquakeScreen() {
  const router = useRouter();
  const styles = useThemedStyles(activityScreenStyles);
  const { recordingDisabled } = useRecordingGate();
  const { magnitude } = useAccelerometer();
  const [phase, setPhase] = useState<'idle' | 'go' | 'done'>('idle');
  const [score, setScore] = useState(0);
  const [rmsG, setRmsG] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [hapticCount, setHapticCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const samplesRef = useRef<number[]>([]);
  const recordingRef = useRef(false);
  const hapticTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (hapticTimerRef.current) {
      clearInterval(hapticTimerRef.current);
      hapticTimerRef.current = null;
    }
    if (shakeTimerRef.current) {
      clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!recordingRef.current) return;
    samplesRef.current.push(magnitude);
    setSampleCount(samplesRef.current.length);
  }, [magnitude]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const finishRecording = useCallback(() => {
    recordingRef.current = false;
    clearTimers();
    const samples = samplesRef.current;
    const rms = magnitudeRms(samples);
    const nextScore = wobbleScoreFromRms(rms);
    setRmsG(rms);
    setScore(nextScore);
    setPhase('done');
  }, [clearTimers]);

  const start = useCallback(() => {
    clearTimers();
    samplesRef.current = [];
    setSampleCount(0);
    setHapticCount(0);
    setScore(0);
    setRmsG(0);
    recordingRef.current = true;
    setPhase('go');

    hapticTimerRef.current = setInterval(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setHapticCount((n) => n + 1);
    }, HAPTIC_INTERVAL_MS);

    shakeTimerRef.current = setTimeout(finishRecording, SHAKE_MS);
  }, [clearTimers, finishRecording]);

  const save = async () => {
    setSaving(true);
    try {
      const sessionId = await saveActivityResult({
        activityType: 'earthquake',
        score,
        payload: { rmsG, sampleCount, hapticCount, shakeMs: SHAKE_MS },
      });
      router.push(`/results/${sessionId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ExperimentScreen>
      <ActivityCard title="Earthquake Structure" live={phase === 'go'}>
        <Text style={styles.p}>
          Place the phone on your model, then vibrate for 5 s while we measure how much it wobbles.
        </Text>
        <StatReadout label="Stability score (inverse wobble)" value={`${score}`} />
        <StatReadout label="Wobble RMS (|a|, g)" value={rmsG > 0 ? rmsG.toFixed(4) : '—'} />
        <StatReadout
          label="Samples / haptic pulses"
          value={phase === 'idle' ? '—' : `${sampleCount} / ${hapticCount}`}
        />
        <View style={styles.actions}>
          <Button
            title={phase === 'go' ? 'Shaking…' : 'Vibrate & record 5 s'}
            onPress={start}
            disabled={phase === 'go' || saving || recordingDisabled}
          />
          <Button
            title={saving ? 'Saving…' : 'Save result'}
            onPress={() => void save()}
            disabled={phase !== 'done' || saving}
          />
          <Button title="Home" variant="secondary" onPress={() => router.back()} />
        </View>
      </ActivityCard>
    </ExperimentScreen>
  );
}
