import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { PageTitle } from '../../components/PageTitle';
import { HandFanAngleOverlay } from '../../components/handfan/HandFanAngleOverlay';
import { HandFanBendChart } from '../../components/handfan/HandFanBendChart';
import { HandFanCameraSection } from '../../components/handfan/HandFanCameraSection';
import { HandFanForceCalculator } from '../../components/handfan/HandFanForceCalculator';
import { HandFanProgressGrid } from '../../components/handfan/HandFanProgressGrid';
import { HandFanResultsTable } from '../../components/handfan/HandFanResultsTable';
import { HandFanTrialSelectors } from '../../components/handfan/HandFanTrialSelectors';
import { useLocation } from '../../hooks/useLocation';
import {
  averageActualAngle,
  buildHandfanSubmitPayload,
} from '../../lib/handfan/buildSubmitPayload';
import {
  allTrialsComplete,
  createInitialHandfanSessionState,
  nextIncompleteTrial,
  trialKey,
  type HandfanDesign,
  type HandfanDistanceCm,
  type HandfanMaterial,
  type HandfanSessionState,
} from '../../lib/handfan/sessionState';
import { showAlert } from '../../lib/alert';
import { saveActivityResult } from '../../services/activityWrite';
import { submitHandfanActivity } from '../../services/stemmApi';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

export default function HandFanScreen() {
  const router = useRouter();
  const teamName = useSessionStore((s) => s.teamName);
  const studentFirstName = useSessionStore((s) => s.studentFirstName);
  const gradeLevel = useSessionStore((s) => s.gradeLevel);

  const [state, setState] = useState<HandfanSessionState>(createInitialHandfanSessionState);
  const [liveAngleDeg, setLiveAngleDeg] = useState(0);
  const [angleDragging, setAngleDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { suburb, address, refresh, loading: locating } = useLocation();

  const styles = useThemedStyles((t) => ({
    ...activityScreenStyles(t),
    screen: {
      flex: 1,
      backgroundColor: t.colors.surfaceAlt,
    },
    fixedZone: {
      paddingHorizontal: t.spacing.md,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: t.spacing.md,
      paddingBottom: t.spacing.xl,
    },
    addr: { color: t.colors.muted, marginBottom: t.spacing.md },
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

  const activeKey = trialKey(state.activeDesign, state.activeDistanceCm);
  const activeTrial = state.trials[activeKey];

  const setReflection = useCallback((partial: Partial<HandfanSessionState['reflection']>) => {
    setState((s) => ({ ...s, reflection: { ...s.reflection, ...partial } }));
  }, []);

  const selectTrial = useCallback((design: HandfanDesign, distanceCm: HandfanDistanceCm) => {
    setState((s) => ({ ...s, activeDesign: design, activeDistanceCm: distanceCm }));
  }, []);

  const setMaterial = useCallback((material: HandfanMaterial) => {
    setState((s) => ({ ...s, material }));
  }, []);

  const setDesign = useCallback((design: HandfanDesign) => {
    setState((s) => ({ ...s, activeDesign: design }));
  }, []);

  const setDistance = useCallback((distanceCm: HandfanDistanceCm) => {
    setState((s) => ({ ...s, activeDistanceCm: distanceCm }));
  }, []);

  const setPredicted = useCallback((predictedAngleDeg: string) => {
    setState((s) => {
      const key = trialKey(s.activeDesign, s.activeDistanceCm);
      return {
        ...s,
        trials: {
          ...s.trials,
          [key]: { ...s.trials[key], predictedAngleDeg },
        },
      };
    });
  }, []);

  const setNotes = useCallback(
    (design: HandfanDesign, distanceCm: HandfanDistanceCm, observationNotes: string) => {
      setState((s) => {
        const key = trialKey(design, distanceCm);
        return {
          ...s,
          trials: {
            ...s.trials,
            [key]: { ...s.trials[key], observationNotes },
          },
        };
      });
    },
    [],
  );

  const setForceCalc = useCallback((partial: Partial<HandfanSessionState['forceCalc']>) => {
    setState((s) => ({ ...s, forceCalc: { ...s.forceCalc, ...partial } }));
  }, []);

  const recordAngle = useCallback(() => {
    const predicted = Number.parseFloat(activeTrial.predictedAngleDeg);
    if (!Number.isFinite(predicted)) {
      showAlert('Predicted angle required', 'Enter your predicted bend angle before recording.');
      return;
    }

    setState((s) => {
      const key = trialKey(s.activeDesign, s.activeDistanceCm);
      const nextTrials = {
        ...s.trials,
        [key]: {
          ...s.trials[key],
          actualAngleDeg: liveAngleDeg,
        },
      };
      const next = nextIncompleteTrial(nextTrials);
      return {
        ...s,
        trials: nextTrials,
        lastRecordedAngleDeg: liveAngleDeg,
        forceCalc: {
          ...s.forceCalc,
          angleDeg: String(liveAngleDeg),
        },
        activeDesign: next?.design ?? s.activeDesign,
        activeDistanceCm: next?.distanceCm ?? s.activeDistanceCm,
      };
    });
  }, [activeTrial.predictedAngleDeg, liveAngleDeg]);

  const uploadResults = async () => {
    if (!allTrialsComplete(state.trials)) {
      showAlert('Incomplete trials', 'Record all 9 bend angles before uploading.');
      return;
    }

    setUploading(true);
    setState((s) => ({ ...s, uploadStatus: 'uploading', uploadError: null }));
    try {
      const place = await refresh();
      const location =
        place?.coords != null
          ? {
              lat: place.coords.lat,
              lng: place.coords.lng,
              address: place.address ?? address ?? undefined,
              suburb: place.suburb ?? suburb ?? undefined,
            }
          : null;

      const payload = buildHandfanSubmitPayload(
        state,
        {
          teamName,
          memberName: studentFirstName,
          gradeLevel,
        },
        location,
      );

      await submitHandfanActivity(payload);

      const sessionId = await saveActivityResult({
        activityType: 'handfan',
        score: averageActualAngle(state.trials),
        payload: {
          ...payload,
          apiUploaded: true,
        },
      });

      setState((s) => ({ ...s, uploadStatus: 'success', uploadError: null }));
      router.push(`/results/${sessionId}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setState((s) => ({ ...s, uploadStatus: 'error', uploadError: message }));
      showAlert('Upload failed', message);
    } finally {
      setUploading(false);
    }
  };

  const trialsComplete = useMemo(() => allTrialsComplete(state.trials), [state.trials]);

  return (
    <View style={styles.screen}>
      <AppHeader />
      <View style={styles.fixedZone}>
        <PageTitle eyebrow="Active session" title="Experiment" />
        <ActivityCard title="Hand Fan Challenge" live>
          <Text style={styles.p}>
            Point the camera at the paper standing upright. Drag the overlay line to match the bend,
            then record the angle for each design and distance combination.
          </Text>

          <HandFanTrialSelectors
            material={state.material}
            design={state.activeDesign}
            distanceCm={state.activeDistanceCm}
            predictedAngleDeg={activeTrial.predictedAngleDeg}
            onMaterialChange={setMaterial}
            onDesignChange={setDesign}
            onDistanceChange={setDistance}
            onPredictedChange={setPredicted}
          />

          <HandFanCameraSection>
            <HandFanAngleOverlay
              angleDeg={liveAngleDeg}
              onAngleChange={setLiveAngleDeg}
              onDragStateChange={setAngleDragging}
            />
          </HandFanCameraSection>

          <View style={styles.actions}>
            <Button title="Record angle" onPress={recordAngle} />
          </View>
        </ActivityCard>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!angleDragging}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={!angleDragging}
      >
        <ActivityCard title="Results & reflection">
          <HandFanProgressGrid
            trials={state.trials}
            activeDesign={state.activeDesign}
            activeDistanceCm={state.activeDistanceCm}
            onSelect={selectTrial}
          />

          <HandFanResultsTable trials={state.trials} onNotesChange={setNotes} />

          <HandFanForceCalculator
            stiffnessK={state.forceCalc.stiffnessK}
            stiffnessLabel={state.forceCalc.stiffnessLabel}
            angleDeg={state.forceCalc.angleDeg}
            onStiffnessChange={(k, label) => setForceCalc({ stiffnessK: k, stiffnessLabel: label })}
            onAngleChange={(angleDeg) => setForceCalc({ angleDeg })}
          />

          <HandFanBendChart trials={state.trials} />

          <Text style={styles.reflectionTitle}>Reflection</Text>
          <FormField
            label="How does material stiffness affect bend angle?"
            value={state.reflection.stiffnessEffect}
            onChangeText={(stiffnessEffect) => setReflection({ stiffnessEffect })}
            multiline
            style={styles.multiline}
          />
          <FormField
            label="How does fan design influence air velocity and paper movement?"
            value={state.reflection.designInfluence}
            onChangeText={(designInfluence) => setReflection({ designInfluence })}
            multiline
            style={styles.multiline}
          />
          <FormField
            label="How does distance from the fan affect bending?"
            value={state.reflection.distanceEffect}
            onChangeText={(distanceEffect) => setReflection({ distanceEffect })}
            multiline
            style={styles.multiline}
          />

          <Text style={styles.addr}>
            {locating
              ? 'Locating…'
              : suburb
                ? `${suburb} · ${address || '—'}`
                : address || 'Location captured at upload'}
          </Text>

          <View style={styles.actions}>
            <Button
              title={uploading ? 'Uploading…' : 'Upload results'}
              variant="secondary"
              onPress={() => void uploadResults()}
              disabled={uploading || !trialsComplete}
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
    </View>
  );
}
