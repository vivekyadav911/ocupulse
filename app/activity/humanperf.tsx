import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { HumanperfAttemptPanel } from '../../components/humanperf/HumanperfAttemptPanel';
import { HumanperfFeedbackControls } from '../../components/humanperf/HumanperfFeedbackControls';
import { HumanperfHardestMovementCard } from '../../components/humanperf/HumanperfHardestMovementCard';
import { HumanperfJerkGauge } from '../../components/humanperf/HumanperfJerkGauge';
import { HumanperfMovementChart } from '../../components/humanperf/HumanperfMovementChart';
import { HumanperfMovementDiagram } from '../../components/humanperf/HumanperfMovementDiagram';
import { HumanperfMovementSelector } from '../../components/humanperf/HumanperfMovementSelector';
import { HumanperfReflectionForm } from '../../components/humanperf/HumanperfReflectionForm';
import { HumanperfResultsTable } from '../../components/humanperf/HumanperfResultsTable';
import { useHumanperfAttempt } from '../../hooks/useHumanperfAttempt';
import { useJerkFeedbackBeep } from '../../hooks/useJerkFeedbackBeep';
import { useLocation } from '../../hooks/useLocation';
import { useRecordingGate } from '../../hooks/useRecordingGate';
import { showAlert } from '../../lib/alert';
import { scoreFromAttempts, smoothnessRating } from '../../lib/calc/humanperfJerk';
import { buildHumanperfSubmitPayload } from '../../lib/humanperf/buildSubmitPayload';
import {
  allMovementsComplete,
  ATTEMPT_DURATIONS_SEC,
  completedMovementCount,
  createInitialHumanperfSessionState,
  nextIncompleteMovement,
  type HumanperfMovementId,
  type HumanperfSessionState,
} from '../../lib/humanperf/sessionState';
import { saveActivityResult } from '../../services/activityWrite';
import { submitHumanperfActivity } from '../../services/stemmApi';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

export default function HumanPerfScreen() {
  const router = useRouter();
  const teamName = useSessionStore((s) => s.teamName);
  const studentFirstName = useSessionStore((s) => s.studentFirstName);
  const gradeLevel = useSessionStore((s) => s.gradeLevel);

  const [state, setState] = useState<HumanperfSessionState>(createInitialHumanperfSessionState);
  const { recordingDisabled } = useRecordingGate();
  const { refresh, loading: locating } = useLocation();
  const processedDoneRef = useRef(false);

  const {
    phase: hookPhase,
    secsLeft,
    progress,
    liveJerkMm,
    peakJerkMm,
    startAttempt,
    stopAttempt,
    resetAttempt,
    getAttemptAggregate,
  } = useHumanperfAttempt();

  useJerkFeedbackBeep({
    enabled: state.feedbackEnabled,
    liveJerkMm,
    thresholdMm: state.feedbackThresholdMm,
  });

  const activeAttempt = state.attempts[state.activeMovement];
  const recording = hookPhase === 'recording';
  const completed = completedMovementCount(state.attempts);
  const nextMovement = nextIncompleteMovement(state.attempts);

  const styles = useThemedStyles((t) => ({
    ...activityScreenStyles(t),
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: t.spacing.xl },
    durationRow: {
      flexDirection: 'row' as const,
      gap: t.spacing.sm,
      marginBottom: t.spacing.sm,
    },
    durationChip: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    durationChipActive: {
      borderColor: t.colors.accent,
      backgroundColor: t.colors.accent + '18',
    },
    durationText: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.text,
    },
    uploadStatus: {
      marginTop: t.spacing.sm,
      fontSize: t.typography.caption,
      color: t.colors.muted,
    },
    uploadError: { color: t.colors.danger },
    uploadSuccess: { color: t.colors.success },
  }));

  const setReflection = useCallback((partial: Partial<HumanperfSessionState['reflection']>) => {
    setState((s) => ({ ...s, reflection: { ...s.reflection, ...partial } }));
  }, []);

  const selectMovement = useCallback(
    (movement: HumanperfMovementId) => {
      if (recording) return;
      setState((s) => ({
        ...s,
        activeMovement: movement,
        attemptPhase: s.attempts[movement] ? 'attemptDone' : 'idle',
      }));
      resetAttempt(state.attemptDurationSec);
    },
    [recording, resetAttempt, state.attemptDurationSec],
  );

  const handleStart = useCallback(() => {
    if (recordingDisabled) {
      showAlert('Battery low', 'Charge the device before starting a timed attempt.');
      return;
    }
    processedDoneRef.current = false;
    setState((s) => ({ ...s, attemptPhase: 'recording' }));
    startAttempt(state.attemptDurationSec);
  }, [recordingDisabled, startAttempt, state.attemptDurationSec]);

  const handleStop = useCallback(() => {
    stopAttempt();
  }, [stopAttempt]);

  const handleRetry = useCallback(() => {
    processedDoneRef.current = false;
    resetAttempt(state.attemptDurationSec);
    setState((s) => ({
      ...s,
      attemptPhase: 'idle',
      attempts: { ...s.attempts, [s.activeMovement]: null },
    }));
  }, [resetAttempt, state.attemptDurationSec]);

  const handleNextMovement = useCallback(() => {
    const next = nextIncompleteMovement(state.attempts);
    if (next == null) return;
    selectMovement(next);
  }, [selectMovement, state.attempts]);

  useEffect(() => {
    if (hookPhase !== 'done') {
      processedDoneRef.current = false;
      return;
    }
    if (processedDoneRef.current) return;
    processedDoneRef.current = true;

    const aggregate = getAttemptAggregate();
    if (aggregate.jerkSeries.length < 5) {
      showAlert('Too few samples', 'Hold the phone and move through the full attempt.');
      resetAttempt(state.attemptDurationSec);
      setState((s) => ({ ...s, attemptPhase: 'idle' }));
      return;
    }

    const attempt = {
      movement: state.activeMovement,
      avgJerkMm: aggregate.avgJerkMm,
      peakJerkMm: aggregate.peakJerkMm,
      durationSec: aggregate.durationSec,
      smoothnessRating: smoothnessRating(aggregate.avgJerkMm),
      jerkSeries: aggregate.jerkSeries,
      recordedAt: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,
      attemptPhase: 'attemptDone',
      attempts: { ...s.attempts, [s.activeMovement]: attempt },
    }));
    resetAttempt(state.attemptDurationSec);
  }, [
    getAttemptAggregate,
    hookPhase,
    resetAttempt,
    state.activeMovement,
    state.attemptDurationSec,
  ]);

  const uploadResults = async () => {
    setState((s) => ({ ...s, uploadStatus: 'uploading', uploadError: null }));
    try {
      const loc = await refresh();
      const payload = buildHumanperfSubmitPayload(
        state,
        { teamName, memberName: studentFirstName, gradeLevel },
        loc
          ? {
              lat: loc.coords.lat,
              lng: loc.coords.lng,
              address: loc.address,
              suburb: loc.suburb,
            }
          : null,
      );
      await submitHumanperfActivity(payload);

      const score = scoreFromAttempts(
        payload.attempts.map((a) => ({ movement: a.movement, avgJerkMm: a.avgJerkMm })),
      );

      const sessionId = await saveActivityResult({
        activityType: 'humanperf',
        score,
        payload: { ...payload, apiUploaded: true },
      });

      setState((s) => ({ ...s, uploadStatus: 'success', uploadError: null }));
      router.push(`/results/${sessionId}`);
    } catch (e) {
      setState((s) => ({
        ...s,
        uploadStatus: 'error',
        uploadError: e instanceof Error ? e.message : 'Upload failed',
      }));
    }
  };

  const uiPhase =
    hookPhase === 'recording'
      ? 'recording'
      : state.attemptPhase === 'attemptDone' && activeAttempt
        ? 'attemptDone'
        : 'idle';

  const canAdvance =
    activeAttempt != null && nextMovement != null && nextMovement !== state.activeMovement;

  return (
    <ExperimentScreen title="Human Performance Lab">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ActivityCard title="Stretch Speed & Gracefulness" live={recording}>
          <Text style={styles.p}>
            Hold the phone and perform each hand movement smoothly. The accelerometer measures jerk
            — sudden changes in motion. Lower jerk means smoother, more graceful movement.
          </Text>

          <HumanperfMovementSelector
            attempts={state.attempts}
            activeMovement={state.activeMovement}
            onSelect={selectMovement}
            disabled={recording}
          />

          <Text style={styles.p}>Duration</Text>
          <View style={styles.durationRow}>
            {ATTEMPT_DURATIONS_SEC.map((sec) => (
              <Pressable
                key={sec}
                style={[
                  styles.durationChip,
                  state.attemptDurationSec === sec && styles.durationChipActive,
                ]}
                disabled={recording}
                onPress={() => {
                  setState((s) => ({ ...s, attemptDurationSec: sec }));
                  resetAttempt(sec);
                }}
              >
                <Text style={styles.durationText}>{sec}s</Text>
              </Pressable>
            ))}
          </View>

          <HumanperfMovementDiagram movement={state.activeMovement} recording={recording} />

          <HumanperfJerkGauge
            liveJerkMm={liveJerkMm}
            peakJerkMm={
              recording || uiPhase === 'attemptDone'
                ? peakJerkMm
                : (activeAttempt?.peakJerkMm ?? null)
            }
            recording={recording}
          />

          <HumanperfFeedbackControls
            enabled={state.feedbackEnabled}
            thresholdMm={state.feedbackThresholdMm}
            onEnabledChange={(feedbackEnabled) => setState((s) => ({ ...s, feedbackEnabled }))}
            onThresholdChange={(feedbackThresholdMm) =>
              setState((s) => ({ ...s, feedbackThresholdMm }))
            }
            disabled={recording}
          />

          <HumanperfAttemptPanel
            phase={uiPhase}
            secsLeft={secsLeft}
            progress={progress}
            attemptDurationSec={state.attemptDurationSec}
            currentAttempt={activeAttempt}
            recordingDisabled={recordingDisabled}
            onStart={handleStart}
            onStop={handleStop}
            onRetry={handleRetry}
            onNextMovement={handleNextMovement}
            canAdvance={canAdvance}
          />
        </ActivityCard>

        {completed > 0 ? (
          <ActivityCard title="Comparison">
            <HumanperfResultsTable attempts={state.attempts} />
            <HumanperfMovementChart attempts={state.attempts} />
            <HumanperfHardestMovementCard attempts={state.attempts} />
          </ActivityCard>
        ) : null}

        {allMovementsComplete(state.attempts) ? (
          <ActivityCard title="Reflection & upload">
            <HumanperfReflectionForm reflection={state.reflection} onChange={setReflection} />
            <View style={styles.actions}>
              <Button
                title={
                  state.uploadStatus === 'uploading'
                    ? locating
                      ? 'Getting GPS…'
                      : 'Uploading…'
                    : 'Upload results'
                }
                onPress={() => void uploadResults()}
                disabled={
                  state.uploadStatus === 'uploading' ||
                  !state.reflection.hardestToKeepSmooth.trim() ||
                  !state.reflection.feedbackHelped.trim() ||
                  !state.reflection.surprises.trim()
                }
              />
              <Button title="Home" variant="secondary" onPress={() => router.back()} />
            </View>
            {state.uploadStatus === 'success' ? (
              <Text style={[styles.uploadStatus, styles.uploadSuccess]}>
                Upload successful — results saved locally too.
              </Text>
            ) : null}
            {state.uploadStatus === 'error' && state.uploadError ? (
              <Text style={[styles.uploadStatus, styles.uploadError]}>{state.uploadError}</Text>
            ) : null}
          </ActivityCard>
        ) : (
          <ActivityCard title="Progress">
            <Text style={styles.p}>
              Complete all 3 movements ({completed}/3) to unlock reflection and group upload.
            </Text>
            <Button title="Home" variant="secondary" onPress={() => router.back()} />
          </ActivityCard>
        )}
      </ScrollView>
    </ExperimentScreen>
  );
}
