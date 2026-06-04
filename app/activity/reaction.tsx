import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { HandSelector } from '../../components/reaction/HandSelector';
import { MovingTraceCanvas } from '../../components/reaction/MovingTraceCanvas';
import { ReactionComparisonTable } from '../../components/reaction/ReactionComparisonTable';
import { ReactionReflectionForm } from '../../components/reaction/ReactionReflectionForm';
import { ReactionStatisticsPanel } from '../../components/reaction/ReactionStatisticsPanel';
import { ReactionSummaryTable } from '../../components/reaction/ReactionSummaryTable';
import { ReactionTapPanel, type TapResult } from '../../components/reaction/ReactionTapPanel';
import { TraceReplayOverlay } from '../../components/reaction/TraceReplayOverlay';
import { StatReadout } from '../../components/StatReadout';
import { useMovingTraceChallenge } from '../../hooks/useMovingTraceChallenge';
import { useRecordingGate } from '../../hooks/useRecordingGate';
import { showAlert } from '../../lib/alert';
import { rankReactionTimes } from '../../lib/calc/reactionStats';
import {
  buildReactionSubmitPayload,
  computeTeamAggregates,
  scoreFromReactionState,
} from '../../lib/reaction/buildSubmitPayload';
import {
  createInitialReactionSessionState,
  dominantNonDominantComparison,
  type Phase3Result,
  type ReactionSessionState,
} from '../../lib/reaction/sessionState';
import { saveActivityResult } from '../../services/activityWrite';
import { insertOutbox, resultsDao } from '../../services/db/sqlite';
import { subscribeTeamExperiments } from '../../services/experimentsData';
import { submitReactionActivity } from '../../services/stemmApi';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

const TRACE_H = 200;

function betterPhase3(a: Phase3Result, b: Phase3Result): Phase3Result {
  return a.accuracyPct >= b.accuracyPct ? a : b;
}

export default function ReactionScreen() {
  const router = useRouter();
  const teamName = useSessionStore((s) => s.teamName);
  const teamId = useSessionStore((s) => s.teamId);
  const studentFirstName = useSessionStore((s) => s.studentFirstName);
  const gradeLevel = useSessionStore((s) => s.gradeLevel);
  const { recordingDisabled } = useRecordingGate();
  const { width: windowW } = useWindowDimensions();
  const traceWidth = Math.max(280, windowW - 48);

  const [state, setState] = useState<ReactionSessionState>(createInitialReactionSessionState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [phase1AttemptKey, setPhase1AttemptKey] = useState(0);
  const [phase2AttemptKey, setPhase2AttemptKey] = useState(0);
  const [phase3AttemptKey, setPhase3AttemptKey] = useState(0);
  const [lastPhase3Attempt, setLastPhase3Attempt] = useState<Phase3Result | null>(null);

  const trace = useMovingTraceChallenge({
    width: traceWidth,
    height: TRACE_H,
  });

  const styles = useThemedStyles(activityScreenStyles);

  const phase3Locked =
    state.phase === 'phase3' || state.phase === 'phase3Results' || trace.phase === 'running';

  useEffect(() => {
    if (trace.phase !== 'done') return;
    const result = trace.consumeResult();
    if (!result) return;
    setLastPhase3Attempt(result);
    setState((s) => ({
      ...s,
      phase3: s.phase3 ? betterPhase3(result, s.phase3) : result,
      phase: 'phase3Results',
    }));
  }, [trace.phase, trace.consumeResult]);

  const setReflection = useCallback((partial: Partial<ReactionSessionState['reflection']>) => {
    setState((s) => ({ ...s, reflection: { ...s.reflection, ...partial } }));
  }, []);

  useEffect(() => {
    if (state.phase !== 'statistics' || !teamId) return;
    if (!state.phase1 || !state.phase2 || !state.phase3) return;

    const sub = subscribeTeamExperiments(teamId, 'reaction', (rows) => {
      const peerPayloads = rows.map((r) => r.payload);
      const teamStats = computeTeamAggregates(
        peerPayloads,
        studentFirstName,
        state.phase1!.reactionMs,
        state.phase2!.reactionMs,
        state.phase3!.accuracyPct,
      );
      setState((s) => ({ ...s, teamStats }));
    });
    return () => sub.unsubscribe();
  }, [state.phase, teamId, studentFirstName, state.phase1, state.phase2, state.phase3]);

  const handlePhase1Continue = useCallback((best: TapResult) => {
    setState((s) => ({
      ...s,
      phase1: best,
      phase: 'phase1Summary',
    }));
  }, []);

  const handlePhase2Continue = useCallback((best: TapResult) => {
    setState((s) => ({
      ...s,
      phase2: { ...best, handUsed: s.handUsed },
      phase: 'phase2Summary',
    }));
  }, []);

  const retryPhase1 = useCallback(() => {
    setPhase1AttemptKey((k) => k + 1);
    setState((s) => ({ ...s, phase: 'phase1' }));
  }, []);

  const retryPhase2 = useCallback(() => {
    setPhase2AttemptKey((k) => k + 1);
    setState((s) => ({ ...s, phase: 'phase2' }));
  }, []);

  const retryPhase3 = useCallback(() => {
    setPhase3AttemptKey((k) => k + 1);
    setLastPhase3Attempt(null);
    trace.reset();
    setState((s) => ({ ...s, phase: 'phase3' }));
  }, [trace]);

  const saveResults = async () => {
    const current = stateRef.current;
    if (!current.phase1 || !current.phase2 || !current.phase3) {
      showAlert('Could not save', 'Complete all three phases before saving.');
      return;
    }

    setState((s) => ({ ...s, uploadStatus: 'uploading', uploadError: null }));
    try {
      const payload = buildReactionSubmitPayload(current, {
        teamName,
        memberName: studentFirstName,
        gradeLevel,
      });
      const score = scoreFromReactionState(current);

      const sessionId = await saveActivityResult({
        activityType: 'reaction',
        score,
        payload: { ...payload, apiUploaded: false },
      });

      setState((s) => ({ ...s, uploadStatus: 'idle' }));
      router.push(`/results/${sessionId}`);

      void submitReactionActivity(payload)
        .then(async () => {
          const existing = await resultsDao.findById(sessionId);
          if (!existing?.dataJson) return;
          const stored = JSON.parse(existing.dataJson) as Record<string, unknown>;
          stored.apiUploaded = true;
          await resultsDao.update({ ...existing, dataJson: JSON.stringify(stored) });
          await insertOutbox(`scores/${sessionId}`, { apiUploaded: true, updatedAt: Date.now() });
        })
        .catch(() => {
          /* local save already succeeded; STEMM API sync is best-effort */
        });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Save failed';
      setState((s) => ({ ...s, uploadStatus: 'error', uploadError: message }));
      showAlert('Could not save', message);
    }
  };

  const comparison = dominantNonDominantComparison(state);
  const phase1Rows = state.phase1
    ? rankReactionTimes([{ name: studentFirstName, reactionMs: state.phase1.reactionMs }])
    : [];

  const canvasW = trace.canvasSize.width || traceWidth;
  const canvasH = trace.canvasSize.height || TRACE_H;

  const renderPhase = () => {
    switch (state.phase) {
      case 'intro':
        return (
          <>
            <Text style={styles.p}>
              Welcome to the Reaction Board Challenge. You will complete three phases: tap reaction
              (dominant hand), tap reaction (non-dominant hand), and a moving-path tracing
              challenge. You can retry each phase — your best result is saved.
            </Text>
            <ReactionReflectionForm
              reflection={state.reflection}
              onChange={setReflection}
              showPrediction
              predictionReadOnly={false}
            />
            <Button
              title="Begin Phase 1"
              onPress={() => setState((s) => ({ ...s, phase: 'phase1' }))}
              disabled={!state.reflection.predictedReactionMs.trim() || recordingDisabled}
            />
          </>
        );

      case 'phase1':
        return (
          <>
            <Text style={styles.p}>
              Phase 1 — Tap reaction (dominant hand). Wait for the coloured button, then tap as fast
              as you can. Retry as many times as you like — your fastest time counts.
            </Text>
            <ReactionTapPanel
              key={`phase1-${phase1AttemptKey}`}
              attemptKey={phase1AttemptKey}
              onContinue={handlePhase1Continue}
              disabled={recordingDisabled}
              autoStart
            />
          </>
        );

      case 'phase1Summary':
        return (
          <>
            <ReactionSummaryTable
              rows={phase1Rows.map((r) => ({
                member: r.name,
                reactionMs: r.reactionMs,
                rank: r.rank,
              }))}
              teamAvg={state.teamStats?.phase1Mean ?? state.phase1?.reactionMs}
              fastest={state.teamStats?.phase1Fastest ?? state.phase1?.reactionMs}
            />
            <Button title="Retry Phase 1" variant="secondary" onPress={retryPhase1} />
            <Button
              title="Continue to Phase 2"
              onPress={() => setState((s) => ({ ...s, phase: 'phase2' }))}
            />
          </>
        );

      case 'phase2':
        return (
          <>
            <Text style={styles.p}>
              Phase 2 — Non-dominant hand. Confirm which hand you are using, then complete the tap
              test. Retry to improve — your best time counts.
            </Text>
            <HandSelector
              value={state.handUsed}
              onChange={(hand) => setState((s) => ({ ...s, handUsed: hand }))}
            />
            <ReactionTapPanel
              key={`phase2-${phase2AttemptKey}`}
              attemptKey={phase2AttemptKey}
              onContinue={handlePhase2Continue}
              disabled={recordingDisabled}
              autoStart
            />
          </>
        );

      case 'phase2Summary':
        return comparison ? (
          <>
            <ReactionComparisonTable
              memberName={studentFirstName}
              comparison={comparison}
              teamAvgDominant={state.teamStats?.phase1Mean ?? comparison.dominantMs}
              teamAvgNonDominant={state.teamStats?.phase2Mean ?? comparison.nonDominantMs}
              fastestDominant={state.teamStats?.phase1Fastest ?? comparison.dominantMs}
              fastestNonDominant={state.teamStats?.phase2Fastest ?? comparison.nonDominantMs}
            />
            <Button title="Retry Phase 2" variant="secondary" onPress={retryPhase2} />
            <Button
              title="Continue to Phase 3"
              onPress={() => {
                setPhase3AttemptKey((k) => k + 1);
                setLastPhase3Attempt(null);
                trace.reset();
                setState((s) => ({ ...s, phase: 'phase3', phase3: null }));
              }}
            />
          </>
        ) : null;

      case 'phase3':
        return (
          <View>
            <Text style={styles.p}>
              Phase 3 — Tracing challenge. Trace the moving sine wave with your finger for 10
              seconds. Each attempt uses a random wave shape — retry to beat your best accuracy.
            </Text>
            <MovingTraceCanvas
              config={trace.config}
              canvasWidth={canvasW}
              canvasHeight={canvasH}
              elapsedMs={trace.elapsedMs}
              durationMs={trace.durationMs}
              isRunning={trace.phase === 'running'}
              onTouch={trace.addTouchPoint}
              onLayout={trace.setCanvasLayout}
            />
            {trace.phase === 'idle' ? (
              <Button title="Start tracing" onPress={trace.start} disabled={recordingDisabled} />
            ) : null}
            {trace.phase === 'running' ? (
              <StatReadout
                label="Progress"
                value={`${Math.round((trace.elapsedMs / trace.durationMs) * 100)}%`}
              />
            ) : null}
          </View>
        );

      case 'phase3Results': {
        const displayResult = lastPhase3Attempt ?? state.phase3;
        if (!displayResult) return null;
        const bestResult = state.phase3;
        return (
          <>
            <StatReadout
              label="This try — accuracy"
              value={`${displayResult.accuracyPct.toFixed(1)}%`}
            />
            <StatReadout
              label="This try — avg delay"
              value={`${Math.round(displayResult.avgDelayMs)} ms`}
            />
            {bestResult && Math.abs(bestResult.accuracyPct - displayResult.accuracyPct) > 0.05 ? (
              <StatReadout
                label="Best accuracy so far"
                value={`${bestResult.accuracyPct.toFixed(1)}%`}
              />
            ) : null}
            <TraceReplayOverlay
              width={canvasW}
              height={canvasH}
              idealTrace={displayResult.idealTrace}
              waveSnapshots={displayResult.waveSnapshots}
              tracePath={displayResult.tracePath}
            />
            <Button title="Retry Phase 3" variant="secondary" onPress={retryPhase3} />
            <Button
              title="Continue with best result"
              onPress={() => setState((s) => ({ ...s, phase: 'statistics' }))}
              disabled={!state.phase3}
            />
          </>
        );
      }

      case 'statistics':
        return (
          <>
            <ReactionStatisticsPanel
              teamStats={state.teamStats}
              currentPhase1Ms={state.phase1?.reactionMs ?? null}
              currentPhase2Ms={state.phase2?.reactionMs ?? null}
              currentPhase3Accuracy={state.phase3?.accuracyPct ?? null}
            />
            {state.phase3 ? (
              <TraceReplayOverlay
                width={canvasW}
                height={canvasH}
                idealTrace={state.phase3.idealTrace}
                waveSnapshots={state.phase3.waveSnapshots}
                tracePath={state.phase3.tracePath}
              />
            ) : null}
            <ReactionReflectionForm
              reflection={state.reflection}
              onChange={setReflection}
              showPrediction
              predictionReadOnly
            />
            {state.uploadError ? (
              <Text style={[styles.p, { color: '#e53935' }]}>{state.uploadError}</Text>
            ) : null}
            <Button
              title={state.uploadStatus === 'uploading' ? 'Saving…' : 'Save & submit'}
              onPress={() => void saveResults()}
              disabled={state.uploadStatus === 'uploading'}
            />
          </>
        );

      default:
        return null;
    }
  };

  const body = (
    <ActivityCard title="Reaction Board" live={trace.phase === 'running'}>
      {renderPhase()}
      {!phase3Locked ? (
        <Button title="Home" variant="secondary" onPress={() => router.back()} />
      ) : null}
    </ActivityCard>
  );

  return (
    <ExperimentScreen title="Reaction Board Challenge" scrollEnabled={!phase3Locked}>
      {body}
    </ExperimentScreen>
  );
}
