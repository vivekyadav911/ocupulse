import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { FormField } from '../../components/FormField';
import { EarthquakeDesignForm } from '../../components/earthquake/EarthquakeDesignForm';
import { EarthquakeDesignSelector } from '../../components/earthquake/EarthquakeDesignSelector';
import { EarthquakeDisplacementChart } from '../../components/earthquake/EarthquakeDisplacementChart';
import { EarthquakeResultsTable } from '../../components/earthquake/EarthquakeResultsTable';
import { EarthquakeRunResults } from '../../components/earthquake/EarthquakeRunResults';
import { EarthquakeSimulatorPanel } from '../../components/earthquake/EarthquakeSimulatorPanel';
import { EarthquakeSummaryCard } from '../../components/earthquake/EarthquakeSummaryCard';
import { useEarthquakeTest } from '../../hooks/useEarthquakeTest';
import { useRecordingGate } from '../../hooks/useRecordingGate';
import { showAlert } from '../../lib/alert';
import type { AccelSample } from '../../lib/calc/earthquakeDisplacement';
import {
  computeEarthquakeReadings,
  stabilityScoreFromPeakCm,
} from '../../lib/calc/earthquakeDisplacement';
import {
  buildEarthquakeSubmitPayload,
  summarizeDesignRuns,
} from '../../lib/earthquake/buildSubmitPayload';
import {
  allRunsComplete,
  completedRunCount,
  createInitialEarthquakeSessionState,
  nextIncompleteDesign,
  type EarthquakeDesign,
  type EarthquakeSessionState,
} from '../../lib/earthquake/sessionState';
import { saveActivityResult } from '../../services/activityWrite';
import { submitEarthquakeActivity } from '../../services/stemmApi';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

function uploadBlockReason(state: EarthquakeSessionState): string | null {
  const remaining = 3 - completedRunCount(state.runs);
  if (remaining > 0) {
    return `Complete all 3 design tests (${remaining} remaining).`;
  }
  if (!state.reflection.bestDesignWhy.trim()) {
    return 'Answer "Which design worked best and why?" before uploading.';
  }
  if (!state.reflection.surprises.trim()) {
    return 'Answer "Any surprises in the results?" before uploading.';
  }
  return null;
}

export default function EarthquakeScreen() {
  const router = useRouter();
  const teamName = useSessionStore((s) => s.teamName);
  const studentFirstName = useSessionStore((s) => s.studentFirstName);
  const gradeLevel = useSessionStore((s) => s.gradeLevel);

  const [state, setState] = useState<EarthquakeSessionState>(createInitialEarthquakeSessionState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const { recordingDisabled } = useRecordingGate();

  const handleTestComplete = useCallback((samples: readonly AccelSample[]) => {
    const readings = computeEarthquakeReadings(samples);
    setState((s) => {
      const updatedRuns = {
        ...s.runs,
        [s.activeDesign]: {
          ...s.runs[s.activeDesign],
          readings,
          testDurationSec: s.testDurationSec,
          completedAt: new Date().toISOString(),
        },
      };
      const next = nextIncompleteDesign(updatedRuns);
      const advance = next != null && next !== s.activeDesign;
      return {
        ...s,
        activeDesign: advance ? next : s.activeDesign,
        runs: updatedRuns,
      };
    });
  }, []);

  const { phase, secsLeft, progress, startTest, resetTest } = useEarthquakeTest(handleTestComplete);

  const activeRun = state.runs[state.activeDesign];
  const completed = completedRunCount(state.runs);
  const testRunning = phase === 'running';
  const showRunResults = activeRun.readings != null && !testRunning;
  const allDesignsDone = allRunsComplete(state.runs);
  const nextDesign = nextIncompleteDesign(state.runs);

  const uploadBlockedReason = uploadBlockReason(state);

  const styles = useThemedStyles((t) => ({
    ...activityScreenStyles(t),
    scrollContent: { paddingBottom: t.spacing.xl },
    multiline: {
      minHeight: 72,
      textAlignVertical: 'top' as const,
    },
    uploadStatus: {
      marginTop: t.spacing.sm,
      fontSize: t.typography.caption,
      color: t.colors.muted,
    },
    uploadHint: {
      marginTop: t.spacing.xs,
      fontSize: t.typography.caption,
      color: t.colors.muted,
    },
    uploadError: { color: t.colors.danger },
    uploadSuccess: { color: t.colors.success },
    recordingHint: {
      fontSize: t.typography.caption,
      color: t.colors.danger,
      marginBottom: t.spacing.sm,
    },
    nextDesignHint: {
      fontSize: t.typography.caption,
      color: t.colors.accent,
      marginTop: t.spacing.sm,
      fontWeight: '600' as const,
    },
    allDoneBanner: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.success,
      marginBottom: t.spacing.sm,
    },
  }));

  const setReflection = useCallback((partial: Partial<EarthquakeSessionState['reflection']>) => {
    setState((s) => ({ ...s, reflection: { ...s.reflection, ...partial } }));
  }, []);

  const selectDesign = useCallback(
    (design: EarthquakeDesign) => {
      setState((s) => ({ ...s, activeDesign: design }));
      resetTest(stateRef.current.testDurationSec);
    },
    [resetTest],
  );

  const updateActiveRun = useCallback((partial: Partial<typeof activeRun>) => {
    setState((s) => ({
      ...s,
      runs: {
        ...s.runs,
        [s.activeDesign]: { ...s.runs[s.activeDesign], ...partial },
      },
    }));
  }, []);

  const validateRunForm = useCallback(() => {
    const { activeDesign, runs } = stateRef.current;
    const run = runs[activeDesign];
    const folds = Number.parseInt(run.folds, 10);
    const pillars = Number.parseInt(run.pillars, 10);
    if (!Number.isFinite(folds) || folds <= 0) {
      showAlert('Folds required', 'Enter the number of folds before starting the test.');
      return false;
    }
    if (!Number.isFinite(pillars) || pillars <= 0) {
      showAlert('Pillars required', 'Enter the number of pillars before starting the test.');
      return false;
    }
    if (!run.predictedMovement) {
      showAlert('Prediction required', 'Select your predicted movement before starting.');
      return false;
    }
    return true;
  }, []);

  const handleStartTest = useCallback(() => {
    if (recordingDisabled) {
      showAlert('Battery low', 'Charge the device before starting the earthquake test.');
      return;
    }
    if (!validateRunForm()) return;
    startTest(stateRef.current.testDurationSec);
  }, [recordingDisabled, validateRunForm, startTest]);

  const handleReplay = useCallback(() => {
    if (recordingDisabled) {
      showAlert('Battery low', 'Charge the device before re-running the test.');
      return;
    }
    if (!validateRunForm()) return;
    setState((s) => ({
      ...s,
      runs: {
        ...s.runs,
        [s.activeDesign]: {
          ...s.runs[s.activeDesign],
          readings: null,
          testDurationSec: null,
          completedAt: null,
        },
      },
    }));
    startTest(stateRef.current.testDurationSec);
  }, [recordingDisabled, validateRunForm, startTest]);

  const uploadResults = async () => {
    const current = stateRef.current;
    const blocked = uploadBlockReason(current);
    if (blocked) {
      showAlert('Not ready to upload', blocked);
      return;
    }

    setState((s) => ({ ...s, uploadStatus: 'uploading', uploadError: null }));
    try {
      const payload = buildEarthquakeSubmitPayload(current, {
        teamName,
        memberName: studentFirstName,
        gradeLevel,
      });

      const summary = summarizeDesignRuns(
        payload.designs.map((d) => ({
          design: d.design,
          folds: d.folds,
          pillars: d.pillars,
          peakDisplacementCm: d.readings.peakDisplacementCm,
        })),
      );
      const bestPeak = summary.bestPeakCm ?? 0;

      const sessionId = await saveActivityResult({
        activityType: 'earthquake',
        score: stabilityScoreFromPeakCm(bestPeak),
        payload: { ...payload, apiUploaded: false, bestPeakCm: bestPeak },
      });

      setState((s) => ({ ...s, uploadStatus: 'success', uploadError: null }));
      router.push(`/results/${sessionId}`);

      void submitEarthquakeActivity(payload).catch(() => {
        /* local save already succeeded; API sync is best-effort */
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed';
      setState((s) => ({
        ...s,
        uploadStatus: 'error',
        uploadError: message,
      }));
      showAlert('Could not save', message);
    }
  };

  return (
    <ExperimentScreen
      title="Earthquake-Resistant Structure"
      contentContainerStyle={styles.scrollContent}
    >
      <ActivityCard title="Earthquake Structure" live={testRunning}>
        <Text style={styles.p}>
          Build up to 3 paper structures, place the phone on each model, and run the earthquake
          simulator. Lower peak displacement means a more stable design.
        </Text>

        {recordingDisabled ? (
          <Text style={styles.recordingHint}>Charge the device to at least 10% to run tests.</Text>
        ) : null}

        <EarthquakeDesignSelector
          runs={state.runs}
          activeDesign={state.activeDesign}
          onSelect={selectDesign}
          disabled={testRunning}
        />

        <EarthquakeDesignForm run={activeRun} onChange={updateActiveRun} disabled={testRunning} />

        <EarthquakeSimulatorPanel
          phase={testRunning ? 'running' : showRunResults ? 'done' : 'idle'}
          secsLeft={secsLeft}
          progress={progress}
          testDurationSec={state.testDurationSec}
          activeDesign={state.activeDesign}
          onDurationChange={(testDurationSec) => setState((s) => ({ ...s, testDurationSec }))}
          onStart={handleStartTest}
          disabled={recordingDisabled || testRunning}
        />

        {showRunResults && nextDesign != null && !allDesignsDone ? (
          <Text style={styles.nextDesignHint}>
            Design {state.activeDesign} saved — fill in Design {nextDesign} above and tap Start
            Earthquake.
          </Text>
        ) : null}

        {showRunResults && activeRun.readings ? (
          <EarthquakeRunResults
            readings={activeRun.readings}
            testDurationSec={activeRun.testDurationSec}
            onReplay={handleReplay}
            replayDisabled={testRunning || recordingDisabled}
          />
        ) : null}
      </ActivityCard>

      {completed > 0 ? (
        <ActivityCard title="Comparison">
          <EarthquakeResultsTable runs={state.runs} />
          <EarthquakeDisplacementChart runs={state.runs} />
          <EarthquakeSummaryCard runs={state.runs} />
        </ActivityCard>
      ) : null}

      <ActivityCard title="Reflection">
        {allDesignsDone ? (
          <Text style={styles.allDoneBanner}>
            All 3 designs complete — fill in the reflection below, then upload your results.
          </Text>
        ) : null}
        <FormField
          label="Which design worked best and why?"
          value={state.reflection.bestDesignWhy}
          onChangeText={(bestDesignWhy) => setReflection({ bestDesignWhy })}
          multiline
          style={styles.multiline}
        />
        <FormField
          label="Any surprises in the results?"
          value={state.reflection.surprises}
          onChangeText={(surprises) => setReflection({ surprises })}
          multiline
          style={styles.multiline}
        />

        <View style={styles.actions}>
          <Button
            title={state.uploadStatus === 'uploading' ? 'Uploading…' : 'Upload results'}
            onPress={() => void uploadResults()}
            disabled={state.uploadStatus === 'uploading' || uploadBlockedReason != null}
          />
          <Button title="Home" variant="secondary" onPress={() => router.back()} />
        </View>

        {uploadBlockedReason && state.uploadStatus !== 'uploading' ? (
          <Text style={styles.uploadHint}>{uploadBlockedReason}</Text>
        ) : null}

        {state.uploadStatus === 'success' ? (
          <Text style={[styles.uploadStatus, styles.uploadSuccess]}>
            Results saved locally. Cloud sync will retry when the API is available.
          </Text>
        ) : null}
        {state.uploadStatus === 'error' && state.uploadError ? (
          <Text style={[styles.uploadStatus, styles.uploadError]}>{state.uploadError}</Text>
        ) : null}
      </ActivityCard>
    </ExperimentScreen>
  );
}
