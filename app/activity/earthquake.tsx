import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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

export default function EarthquakeScreen() {
  const router = useRouter();
  const teamName = useSessionStore((s) => s.teamName);
  const studentFirstName = useSessionStore((s) => s.studentFirstName);
  const gradeLevel = useSessionStore((s) => s.gradeLevel);

  const [state, setState] = useState<EarthquakeSessionState>(createInitialEarthquakeSessionState);
  const { recordingDisabled } = useRecordingGate();
  const { phase, secsLeft, progress, samplesRef, startTest, resetTest } = useEarthquakeTest();
  const processedDoneRef = useRef(false);

  const activeRun = state.runs[state.activeDesign];
  const completed = completedRunCount(state.runs);

  const styles = useThemedStyles((t) => ({
    ...activityScreenStyles(t),
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: t.spacing.xl },
    reflectionTitle: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
    },
    multiline: {
      minHeight: 72,
      textAlignVertical: 'top' as const,
    },
    uploadStatus: {
      marginTop: t.spacing.sm,
      fontSize: t.typography.caption,
      color: t.colors.muted,
    },
    uploadError: { color: t.colors.danger },
    uploadSuccess: { color: t.colors.success },
  }));

  const setReflection = useCallback((partial: Partial<EarthquakeSessionState['reflection']>) => {
    setState((s) => ({ ...s, reflection: { ...s.reflection, ...partial } }));
  }, []);

  const selectDesign = useCallback(
    (design: EarthquakeDesign) => {
      setState((s) => ({
        ...s,
        activeDesign: design,
        testPhase: s.runs[design].readings ? 'runDone' : 'idle',
      }));
      resetTest(state.testDurationSec);
    },
    [resetTest, state.testDurationSec],
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
    const run = state.runs[state.activeDesign];
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
  }, [state.activeDesign, state.runs]);

  const handleStartTest = useCallback(() => {
    if (!validateRunForm()) return;
    resetTest(state.testDurationSec);
    setState((s) => ({ ...s, testPhase: 'running' }));
    startTest(state.testDurationSec);
  }, [validateRunForm, resetTest, startTest, state.testDurationSec]);

  useEffect(() => {
    if (phase !== 'done') {
      processedDoneRef.current = false;
      return;
    }
    if (processedDoneRef.current) return;
    processedDoneRef.current = true;

    const readings = computeEarthquakeReadings(samplesRef.current);
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
        testPhase: advance ? 'idle' : 'runDone',
        activeDesign: advance ? next : s.activeDesign,
        runs: updatedRuns,
      };
    });
    resetTest(state.testDurationSec);
  }, [phase, samplesRef, resetTest, state.testDurationSec]);

  const handleReplay = useCallback(() => {
    if (!validateRunForm()) return;
    resetTest(state.testDurationSec);
    setState((s) => ({
      ...s,
      testPhase: 'running',
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
    startTest(state.testDurationSec);
  }, [validateRunForm, resetTest, startTest, state.activeDesign, state.testDurationSec]);

  const uploadResults = async () => {
    setState((s) => ({ ...s, uploadStatus: 'uploading', uploadError: null }));
    try {
      const payload = buildEarthquakeSubmitPayload(state, {
        teamName,
        memberName: studentFirstName,
        gradeLevel,
      });
      await submitEarthquakeActivity(payload);

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
        payload: { ...payload, apiUploaded: true, bestPeakCm: bestPeak },
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

  const testRunning = phase === 'running' || state.testPhase === 'running';
  const showRunResults = activeRun.readings != null && !testRunning;

  return (
    <ExperimentScreen title="Earthquake-Resistant Structure">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ActivityCard title="Earthquake Structure" live={testRunning}>
          <Text style={styles.p}>
            Build up to 3 paper structures, place the phone on each model, and run the earthquake
            simulator. Lower peak displacement means a more stable design.
          </Text>

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
            onDurationChange={(testDurationSec) => setState((s) => ({ ...s, testDurationSec }))}
            onStart={handleStartTest}
            disabled={recordingDisabled || testRunning}
          />

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
              disabled={
                state.uploadStatus === 'uploading' ||
                !allRunsComplete(state.runs) ||
                !state.reflection.bestDesignWhy.trim() ||
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
      </ScrollView>
    </ExperimentScreen>
  );
}
