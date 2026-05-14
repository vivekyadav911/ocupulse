import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatReadout } from '../../components/StatReadout';
import { averageReactionMs, traceScoreFromMse } from '../../lib/calc/reactionStats';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { colors, spacing } from '../../theme/tokens';

export default function ReactionScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const [step, setStep] = useState<'react' | 'trace'>('react');
  const [times, setTimes] = useState<number[]>([]);
  const [armed, setArmed] = useState(false);
  const startPress = useRef(0);
  const [traceNoise, setTraceNoise] = useState(0.01);

  const armRound = useCallback(() => {
    setArmed(false);
    const delay = 1000 + Math.random() * 3000;
    setTimeout(() => {
      setArmed(true);
      startPress.current = performance.now();
    }, delay);
  }, []);

  const startReact = () => {
    setTimes([]);
    armRound();
  };

  const registerTap = () => {
    if (!armed) return;
    const ms = performance.now() - startPress.current;
    setArmed(false);
    setTimes((t) => {
      const next = [...t, ms];
      if (next.length >= 5) {
        setStep('trace');
        return next;
      }
      armRound();
      return next;
    });
  };

  const avgReact = averageReactionMs(times);
  const traceScore = traceScoreFromMse(traceNoise);
  const combo = Math.round(
    Math.min(50, avgReact > 0 ? 5000 / avgReact : 0) + Math.min(50, traceScore * 0.5),
  );

  const save = async () => {
    const sessionId = await writeSessionOptimistic({
      activityType: 'reaction',
      teamName: team,
      score: Math.min(100, combo),
      payload: { avgReactionMs: avgReact, traceScore, taps: times },
    });
    router.push(`/results/${sessionId}`);
  };

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.title}>Reaction Board</Text>
        {step === 'react' ? (
          <>
            <StatReadout label="Completed taps" value={`${times.length} / 5`} />
            <StatReadout label="Avg ms (live)" value={`${Math.round(avgReact)}`} />
            <Text style={styles.instr}>
              {armed
                ? 'Tap the button now!'
                : times.length >= 5
                  ? 'Done — go to trace'
                  : 'Wait for prompt…'}
            </Text>
            <Button title="Start reaction rounds" onPress={startReact} />
            <Button title="Tap!" onPress={registerTap} disabled={!armed} />
          </>
        ) : (
          <>
            <StatReadout label="Trace deviation metric" value={`${traceNoise.toFixed(4)}`} />
            <View
              style={styles.trace}
              onTouchMove={(e) =>
                setTraceNoise((n) => n + Math.abs(e.nativeEvent.locationY) * 0.00001)
              }
            >
              <Text style={styles.traceHelp}>Drag finger here</Text>
            </View>
            <Button title="Save result" onPress={save} />
          </>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt },
  title: { fontSize: 22, fontWeight: '800', marginBottom: spacing.md, color: colors.primary },
  instr: { fontSize: 16, marginVertical: spacing.md, fontWeight: '600', color: colors.accent },
  trace: {
    height: 140,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  traceHelp: { color: colors.muted },
});
