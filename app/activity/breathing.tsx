import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { BreathingGroupBarChart } from '../../components/breathing/BreathingGroupBarChart';
import { BreathingHealthReportCard } from '../../components/breathing/BreathingHealthReportCard';
import { BreathingReflectionForm } from '../../components/breathing/BreathingReflectionForm';
import { BreathingResultsTable } from '../../components/breathing/BreathingResultsTable';
import { BreathingStateSelector } from '../../components/breathing/BreathingStateSelector';
import { BreathingStatusBadge } from '../../components/breathing/BreathingStatusBadge';
import { BreathingSummaryCard } from '../../components/breathing/BreathingSummaryCard';
import { BreathingWaveformArchive } from '../../components/breathing/BreathingWaveformArchive';
import { BreathingWaveformChart } from '../../components/breathing/BreathingWaveformChart';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { StatReadout } from '../../components/StatReadout';
import {
  useBreathingMonitor,
  type BreathingRecordingResult,
} from '../../hooks/useBreathingMonitor';
import { useLocation } from '../../hooks/useLocation';
import { useRecordingGate } from '../../hooks/useRecordingGate';
import { showAlert } from '../../lib/alert';
import { buildBreathingSubmitPayload } from '../../lib/breathing/buildSubmitPayload';
import type { BreathingLocation } from '../../lib/breathing/buildSubmitPayload';
import {
  allStatesRecorded,
  breathingStateLabel,
  computeBreathingTeamAggregates,
  createInitialBreathingSessionState,
  nextIncompleteState,
  scoreFromBreathingRecordings,
  type BreathingSessionState,
  type BreathingStateId,
} from '../../lib/breathing/sessionState';
import { saveActivityResult } from '../../services/activityWrite';
import { insertOutbox, resultsDao } from '../../services/db/sqlite';
import { subscribeTeamExperiments } from '../../services/experimentsData';
import { submitBreathingActivity } from '../../services/stemmApi';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

const LOCATION_TIMEOUT_MS = 3000;

async function resolveLocationWithTimeout(
  refresh: () => Promise<{
    coords: { lat: number; lng: number };
    address: string;
    suburb: string;
  } | null>,
  cached: BreathingLocation,
): Promise<BreathingLocation> {
  try {
    const fresh = await Promise.race([
      refresh(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS)),
    ]);
    if (fresh?.coords) {
      return {
        lat: fresh.coords.lat,
        lng: fresh.coords.lng,
        address: fresh.address,
        suburb: fresh.suburb,
      };
    }
  } catch {
    /* fall back to cached */
  }
  return cached;
}

export default function BreathingScreen() {
  const router = useRouter();
  const teamName = useSessionStore((s) => s.teamName);
  const teamId = useSessionStore((s) => s.teamId);
  const studentFirstName = useSessionStore((s) => s.studentFirstName);
  const gradeLevel = useSessionStore((s) => s.gradeLevel);

  const [state, setState] = useState<BreathingSessionState>(createInitialBreathingSessionState);
  const [pendingResult, setPendingResult] = useState<BreathingRecordingResult | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const processedDoneRef = useRef(false);

  const { recordingDisabled } = useRecordingGate();
  const { coords, suburb, address, refresh } = useLocation();
  const monitor = useBreathingMonitor();

  const styles = useThemedStyles((t) => ({
    ...activityScreenStyles(t),
    uploadStatus: {
      marginTop: t.spacing.sm,
      fontSize: t.typography.caption,
      color: t.colors.muted,
    },
    uploadError: { color: t.colors.danger },
  }));

  useEffect(() => {
    if (monitor.running || monitor.progress >= 1) return;
    processedDoneRef.current = false;
  }, [monitor.running, monitor.progress]);

  useEffect(() => {
    if (monitor.running || processedDoneRef.current) return;
    if (monitor.progress < 1) return;
    processedDoneRef.current = true;

    const result = monitor.finishRecording();
    if (result.peakCount < 1) {
      showAlert(
        'Not enough data',
        'No peaks were detected on the graph. Keep the phone still on your chest and breathe steadily — each breath should show as a peak.',
      );
      monitor.reset();
      setPendingResult(null);
      setState((s) => ({ ...s, phase: 'intro' }));
      return;
    }

    setPendingResult(result);
    setState((s) => ({ ...s, phase: 'verifyPeaks' }));
  }, [monitor.running, monitor.progress, monitor.finishRecording, monitor.reset]);

  const confirmVerifiedResult = useCallback(() => {
    const result = pendingResult;
    if (!result) return;

    const activeState = stateRef.current.activeState;
    setState((s) => ({
      ...s,
      phase: 'stateSummary',
      recordings: {
        ...s.recordings,
        [activeState]: {
          bpm: result.bpm,
          peakCount: result.peakCount,
          waveform: result.waveform,
          predictedBpm: s.pendingPrediction,
          recordedAt: new Date().toISOString(),
        },
      },
      pendingPrediction: '',
    }));
    setPendingResult(null);
  }, [pendingResult]);

  const retryVerification = useCallback(() => {
    processedDoneRef.current = false;
    setPendingResult(null);
    monitor.reset();
    setState((s) => ({ ...s, phase: 'intro' }));
  }, [monitor]);

  useEffect(() => {
    if (state.phase !== 'results' || !teamId) return;
    if (!allStatesRecorded(state.recordings)) return;

    const sub = subscribeTeamExperiments(teamId, 'breathing', (rows) => {
      const peerPayloads = rows.map((r) => r.payload);
      const teamAggregates = computeBreathingTeamAggregates(
        peerPayloads,
        studentFirstName,
        state.recordings,
      );
      setState((s) => ({ ...s, teamAggregates }));
    });
    return () => sub.unsubscribe();
  }, [state.phase, teamId, studentFirstName, state.recordings]);

  const setReflection = useCallback((partial: Partial<BreathingSessionState['reflection']>) => {
    setState((s) => ({ ...s, reflection: { ...s.reflection, ...partial } }));
  }, []);

  const selectState = useCallback((id: BreathingStateId) => {
    setState((s) => ({ ...s, activeState: id, pendingPrediction: '' }));
  }, []);

  const startRecording = useCallback(() => {
    if (recordingDisabled) {
      showAlert('Battery low', 'Charge the device before starting a timed recording.');
      return;
    }
    if (!stateRef.current.pendingPrediction.trim()) {
      showAlert('Prediction required', 'Enter your predicted BPM before recording.');
      return;
    }
    processedDoneRef.current = false;
    monitor.reset();
    setPendingResult(null);
    setState((s) => ({ ...s, phase: 'recording' }));
    monitor.start();
  }, [recordingDisabled, monitor]);

  const continueAfterState = useCallback(() => {
    const next = nextIncompleteState(stateRef.current.recordings);
    if (next) {
      setState((s) => ({
        ...s,
        phase: 'intro',
        activeState: next,
        pendingPrediction: '',
      }));
      monitor.reset();
    } else {
      const aggregates = computeBreathingTeamAggregates(
        [],
        studentFirstName,
        stateRef.current.recordings,
      );
      setState((s) => ({ ...s, phase: 'results', teamAggregates: aggregates }));
    }
  }, [monitor, studentFirstName]);

  const retryState = useCallback(() => {
    const active = stateRef.current.activeState;
    processedDoneRef.current = false;
    monitor.reset();
    setPendingResult(null);
    setState((s) => ({
      ...s,
      phase: 'intro',
      recordings: { ...s.recordings, [active]: undefined },
      pendingPrediction: '',
    }));
  }, [monitor]);

  const saveResults = async () => {
    const current = stateRef.current;
    if (!allStatesRecorded(current.recordings)) {
      showAlert('Could not save', 'Complete all three session states before saving.');
      return;
    }

    setState((s) => ({ ...s, uploadStatus: 'uploading', uploadError: null }));

    const cachedLocation: BreathingLocation = coords
      ? { lat: coords.lat, lng: coords.lng, address, suburb }
      : null;

    try {
      const location = await resolveLocationWithTimeout(refresh, cachedLocation);
      const payload = buildBreathingSubmitPayload(
        current,
        {
          teamName,
          memberName: studentFirstName,
          gradeLevel,
        },
        location,
      );
      const score = scoreFromBreathingRecordings(current.recordings);

      const sessionId = await saveActivityResult({
        activityType: 'breathing',
        score,
        payload: { ...payload, apiUploaded: false },
      });

      setState((s) => ({ ...s, uploadStatus: 'idle' }));
      router.push(`/results/${sessionId}`);

      void submitBreathingActivity(payload)
        .then(async () => {
          const existing = await resultsDao.findById(sessionId);
          if (!existing?.dataJson) return;
          const stored = JSON.parse(existing.dataJson) as Record<string, unknown>;
          stored.apiUploaded = true;
          await resultsDao.update({ ...existing, dataJson: JSON.stringify(stored) });
          await insertOutbox(`scores/${sessionId}`, { apiUploaded: true, updatedAt: Date.now() });
        })
        .catch(() => {
          /* local save already succeeded */
        });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Save failed';
      setState((s) => ({ ...s, uploadStatus: 'error', uploadError: message }));
      showAlert('Could not save', message);
    }
  };

  const aggregates =
    state.teamAggregates ??
    (allStatesRecorded(state.recordings)
      ? computeBreathingTeamAggregates([], studentFirstName, state.recordings)
      : null);

  const renderPhase = () => {
    switch (state.phase) {
      case 'intro':
        return (
          <>
            <Text style={styles.p}>
              Place the phone flat on your chest. Select a session state, predict your breathing
              rate, then record for 30 seconds. Each breath is the highest peak on the graph (at
              least 1 s apart) paired with its deepest trough.
            </Text>
            <BreathingStateSelector
              value={state.activeState}
              onChange={selectState}
              completed={state.recordings}
              disabled={monitor.running}
            />
            <BreathingReflectionForm
              predictedBpm={state.pendingPrediction}
              onPredictedChange={(v) => setState((s) => ({ ...s, pendingPrediction: v }))}
              reflection={state.reflection}
              onReflectionChange={setReflection}
              showPrediction
              stateLabel={breathingStateLabel(state.activeState)}
            />
            <BreathingStatusBadge bpm={monitor.liveBpm} />
            <BreathingWaveformChart samples={monitor.waveform} />
            <Button
              title="Record 30 s"
              onPress={startRecording}
              disabled={
                recordingDisabled ||
                !state.pendingPrediction.trim() ||
                state.recordings[state.activeState] != null
              }
            />
          </>
        );

      case 'recording':
        return (
          <>
            <Text style={styles.p}>
              Recording — {breathingStateLabel(state.activeState)}. Breathe normally and keep the
              phone still on your chest.
            </Text>
            <BreathingStatusBadge bpm={monitor.liveBpm} />
            <BreathingWaveformChart samples={monitor.waveform} />
            <StatReadout label="Window progress" value={`${Math.round(monitor.progress * 100)}%`} />
            <StatReadout label="Peaks detected" value={`${monitor.liveBreathCount}`} />
            <StatReadout label="Combined signal" value={`${monitor.signal.toFixed(3)} g`} />
          </>
        );

      case 'verifyPeaks': {
        if (!pendingResult) return null;
        return (
          <>
            <Text style={styles.p}>
              {breathingStateLabel(state.activeState)} — count the red dots. Each dot is the highest
              peak (≥1 s apart) paired with the deepest trough before it. We detected{' '}
              <Text style={{ fontWeight: '700' }}>{pendingResult.peakCount}</Text> peak
              {pendingResult.peakCount === 1 ? '' : 's'} →{' '}
              <Text style={{ fontWeight: '700' }}>{pendingResult.bpm.toFixed(1)} BPM</Text>.
            </Text>
            <BreathingWaveformChart
              samples={pendingResult.waveform}
              title="Full recording — peaks marked"
              peakTimes={pendingResult.peakTimes}
            />
            <StatReadout label="Peaks counted" value={`${pendingResult.peakCount}`} />
            <StatReadout label="Calculated BPM" value={`${pendingResult.bpm.toFixed(1)}`} />
            <Button title="Peaks look correct — show results" onPress={confirmVerifiedResult} />
            <Button title="Retry recording" variant="secondary" onPress={retryVerification} />
          </>
        );
      }

      case 'stateSummary': {
        const rec = state.recordings[state.activeState];
        if (!rec) return null;
        return (
          <>
            <Text style={styles.p}>
              {breathingStateLabel(state.activeState)} — recorded average:{' '}
              <Text style={{ fontWeight: '700' }}>{rec.bpm.toFixed(1)} BPM</Text> ({rec.peakCount}{' '}
              peaks on graph). You predicted {rec.predictedBpm || '—'} BPM.
            </Text>
            <BreathingStatusBadge bpm={rec.bpm} />
            <BreathingWaveformChart samples={rec.waveform} title="Recorded waveform" />
            <Button title="Retry this state" variant="secondary" onPress={retryState} />
            <Button
              title={
                nextIncompleteState(state.recordings)
                  ? 'Continue to next state'
                  : 'View team results'
              }
              onPress={continueAfterState}
            />
          </>
        );
      }

      case 'results':
        return (
          <>
            <BreathingResultsTable
              rows={aggregates?.memberRows ?? []}
              highlightMember={aggregates?.highestIncreaseMember}
            />
            <BreathingGroupBarChart rows={aggregates?.memberRows ?? []} />
            <BreathingSummaryCard aggregates={aggregates} />
            <BreathingHealthReportCard gradeLevel={gradeLevel} recordings={state.recordings} />
            <BreathingWaveformArchive rows={aggregates?.memberRows ?? []} />
            <BreathingReflectionForm
              predictedBpm=""
              onPredictedChange={() => {}}
              reflection={state.reflection}
              onReflectionChange={setReflection}
              showPrediction={false}
              showPostReflection
            />
            {state.uploadError ? (
              <Text style={[styles.uploadStatus, styles.uploadError]}>{state.uploadError}</Text>
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

  return (
    <ExperimentScreen title="Breathing Pace Trainer">
      <ActivityCard title="Breathing Pace Trainer" live={monitor.running}>
        {renderPhase()}
        {state.phase !== 'recording' && state.phase !== 'verifyPeaks' ? (
          <Button title="Home" variant="secondary" onPress={() => router.back()} />
        ) : null}
      </ActivityCard>
    </ExperimentScreen>
  );
}
