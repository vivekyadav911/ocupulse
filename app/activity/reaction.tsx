import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { StatReadout } from '../../components/StatReadout';
import {
  averageReactionMs,
  combinedReactionScore,
  idealTraceSvgPath,
  randomReactionDelayMs,
  tracePathMse,
  traceScoreFromMse,
  type Point2,
} from '../../lib/calc/reactionStats';
import { useRecordingGate } from '../../hooks/useRecordingGate';
import { showAlert } from '../../lib/alert';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

const REACTION_ROUNDS = 5;

export default function ReactionScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const { recordingDisabled } = useRecordingGate();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(activityScreenStyles);

  const [phase, setPhase] = useState<'react' | 'trace'>('react');
  const [times, setTimes] = useState<number[]>([]);
  const [armed, setArmed] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [tracePoints, setTracePoints] = useState<Point2[]>([]);
  const [traceSize, setTraceSize] = useState({ w: 300, h: 160 });
  const [saving, setSaving] = useState(false);

  const startPress = useRef(0);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDelayTimer = useCallback(() => {
    if (delayTimer.current) {
      clearTimeout(delayTimer.current);
      delayTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearDelayTimer(), [clearDelayTimer]);

  const armRound = useCallback(() => {
    clearDelayTimer();
    setArmed(false);
    setWaiting(true);
    delayTimer.current = setTimeout(() => {
      setWaiting(false);
      setArmed(true);
      startPress.current = performance.now();
    }, randomReactionDelayMs());
  }, [clearDelayTimer]);

  const startReact = () => {
    setTimes([]);
    setPhase('react');
    armRound();
  };

  const registerTap = () => {
    if (!armed) return;
    const ms = performance.now() - startPress.current;
    setArmed(false);
    setTimes((prev) => {
      const next = [...prev, ms];
      if (next.length >= REACTION_ROUNDS) {
        setPhase('trace');
        setTracePoints([]);
        return next;
      }
      armRound();
      return next;
    });
  };

  const onTraceLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setTraceSize({ w: width, h: height });
  };

  const addTracePoint = (locationX: number, locationY: number) => {
    const x = locationX / traceSize.w;
    const y = locationY / traceSize.h;
    setTracePoints((pts) => [
      ...pts,
      { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) },
    ]);
  };

  const avgReact = averageReactionMs(times);
  const traceMse = tracePathMse(tracePoints);
  const traceScore = traceScoreFromMse(traceMse);
  const combo = combinedReactionScore(avgReact, traceScore);
  const pathD = idealTraceSvgPath(traceSize.w, traceSize.h);

  const save = async () => {
    if (times.length < REACTION_ROUNDS || tracePoints.length < 8) return;
    setSaving(true);
    try {
      const sessionId = await writeSessionOptimistic({
        activityType: 'reaction',
        teamName: team,
        score: combo,
        payload: {
          avgReactionMs: avgReact,
          reactionTimesMs: times,
          traceMse,
          traceScore,
          tracePointCount: tracePoints.length,
        },
      });
      router.push(`/results/${sessionId}`);
    } catch (e) {
      showAlert('Could not save', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ExperimentScreen>
      <ActivityCard title="Reaction Board" live={armed || waiting}>
        {phase === 'react' ? (
          <>
            <Text style={styles.p}>
              Phase A: wait for the prompt, then tap as fast as you can (5 rounds).
            </Text>
            <StatReadout label="Completed taps" value={`${times.length} / ${REACTION_ROUNDS}`} />
            <StatReadout
              label="Avg reaction (ms)"
              value={times.length ? `${Math.round(avgReact)}` : '—'}
            />
            <Text style={styles.instr}>
              {armed ? 'Tap now!' : waiting ? 'Wait…' : 'Press start to begin'}
            </Text>
            <Button
              title="Start reaction rounds"
              onPress={startReact}
              disabled={waiting || armed || recordingDisabled}
            />
            <Button title="Tap!" onPress={registerTap} disabled={!armed} />
            <Button title="Home" variant="secondary" onPress={() => router.back()} />
          </>
        ) : (
          <>
            <Text style={styles.p}>
              Phase B: drag along the sine path. Lower deviation = higher trace score.
            </Text>
            <StatReadout label="Avg reaction (ms)" value={`${Math.round(avgReact)}`} />
            <StatReadout label="Trace score" value={`${traceScore}`} />
            <StatReadout label="Combined score" value={`${combo}`} />
            <View
              style={[styles.trace, { padding: 0, overflow: 'hidden' }]}
              onLayout={onTraceLayout}
              onTouchStart={(e) => addTracePoint(e.nativeEvent.locationX, e.nativeEvent.locationY)}
              onTouchMove={(e) => addTracePoint(e.nativeEvent.locationX, e.nativeEvent.locationY)}
            >
              <Svg width={traceSize.w} height={traceSize.h}>
                <Path
                  d={pathD}
                  stroke={colors.accent}
                  strokeWidth={3}
                  fill="none"
                  strokeDasharray="8 6"
                />
              </Svg>
              {tracePoints.length < 8 ? (
                <Text style={[styles.traceHelp, { position: 'absolute' }]} pointerEvents="none">
                  Drag finger along path
                </Text>
              ) : null}
            </View>
            <Button
              title={saving ? 'Saving…' : 'Save result'}
              onPress={() => void save()}
              disabled={tracePoints.length < 8 || saving}
            />
            <Button title="Home" variant="secondary" onPress={() => router.back()} />
          </>
        )}
      </ActivityCard>
    </ExperimentScreen>
  );
}
