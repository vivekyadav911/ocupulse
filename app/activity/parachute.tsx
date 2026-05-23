import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, Switch, Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { FormField } from '../../components/FormField';
import { LinearAccelCharts } from '../../components/LinearAccelCharts';
import { ParachuteResultsTable } from '../../components/ParachuteResultsTable';
import { ParachuteSlowMotionReview } from '../../components/ParachuteSlowMotionReview';
import { StatReadout } from '../../components/StatReadout';
import { useAccelerometer } from '../../hooks/useAccelerometer';
import { useCameraRecorder } from '../../hooks/useCameraRecorder';
import { useDeviceMotionLinearAccel } from '../../hooks/useDeviceMotionLinearAccel';
import { useLocation } from '../../hooks/useLocation';
import { useRecordingGate } from '../../hooks/useRecordingGate';
import { estimateImpactImpulse } from '../../lib/calc/impactImpulse';
import type { AccelTimelineSample } from '../../lib/calc/impactImpulse';
import { gForceNoBounce } from '../../lib/calc/gforce';
import { fmtCalc } from '../../lib/calc/parachuteCalc';
import {
  createInitialChallengeState,
  SESSION_SEC,
  TAB_KEYS,
  TAB_LABELS,
  type ChallengeState,
  type TabData,
  type TabKey,
} from '../../lib/parachute/challengeState';
import {
  activeTabCalc,
  buildSubmitPayload,
  formatSessionTime,
  summarizeAllRuns,
} from '../../lib/parachute/runSummary';
import { saveActivityResult } from '../../services/activityWrite';
import { submitParachuteActivity } from '../../services/stemmApi';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

const TRANSFER_WINDOW_SEC = 10;

type FrozenImpulseSnapshot = {
  deltaVMps: number;
  contactTimeS: number;
  peakMagnitudeMs2: number | null;
  referenceG: number;
};

export default function ParachuteScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const teamName = useSessionStore((s) => s.teamName);
  const studentFirstName = useSessionStore((s) => s.studentFirstName);
  const gradeLevel = useSessionStore((s) => s.gradeLevel);

  const [state, setState] = useState<ChallengeState>(createInitialChallengeState);
  const activeTab = state.tabs[state.activeTab];

  const sessionTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallStartRef = useRef<number | null>(null);
  const [fallElapsed, setFallElapsed] = useState(0);
  const [fallRunning, setFallRunning] = useState(false);

  const { recordingDisabled } = useRecordingGate();
  const cam = useCameraRecorder({ maxDurationSec: 120, frameSampleHz: 120 });
  const location = useLocation();

  const dm = useDeviceMotionLinearAccel();
  const accelRaw = useAccelerometer();
  const useDmStream = !dm.motionDenied && dm.available === true;
  const plotX = useDmStream ? dm.x : accelRaw.x;
  const plotY = useDmStream ? dm.y : accelRaw.y;
  const plotZ = useDmStream ? dm.z : accelRaw.z;
  const plotMagLive = useDmStream ? dm.magnitude : accelRaw.magnitude;
  const impulseSamples: AccelTimelineSample[] = useDmStream ? dm.buffer : accelRaw.buffer;
  const impulse = useMemo(() => estimateImpactImpulse(impulseSamples), [impulseSamples]);

  const [showLiveGraphs, setShowLiveGraphs] = useState(false);
  const [transferSecsLeft, setTransferSecsLeft] = useState(0);
  const [frozenImpulse, setFrozenImpulse] = useState<FrozenImpulseSnapshot | null>(null);
  const transferTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [savingLocal, setSavingLocal] = useState(false);

  const calc = useMemo(() => activeTabCalc(state), [state]);
  const allRuns = useMemo(() => summarizeAllRuns(state), [state]);

  const updateTab = useCallback((key: TabKey, partial: Partial<TabData>) => {
    setState((s) => ({
      ...s,
      tabs: { ...s.tabs, [key]: { ...s.tabs[key], ...partial } },
    }));
  }, []);

  const setReflection = useCallback((partial: Partial<ChallengeState['reflection']>) => {
    setState((s) => ({ ...s, reflection: { ...s.reflection, ...partial } }));
  }, []);

  const clearSessionTick = () => {
    if (sessionTickRef.current) {
      clearInterval(sessionTickRef.current);
      sessionTickRef.current = null;
    }
  };

  const clearFallTick = () => {
    if (fallTickRef.current) {
      clearInterval(fallTickRef.current);
      fallTickRef.current = null;
    }
  };

  const clearTransferTicker = () => {
    if (transferTickRef.current != null) {
      clearInterval(transferTickRef.current);
      transferTickRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearSessionTick();
      clearFallTick();
      clearTransferTicker();
    };
  }, []);

  useEffect(() => {
    if (state.sessionTimer.running) {
      clearSessionTick();
      sessionTickRef.current = setInterval(() => {
        setState((s) => {
          if (!s.sessionTimer.running || s.sessionTimer.secsLeft <= 0) {
            return {
              ...s,
              sessionTimer: { ...s.sessionTimer, running: false, secsLeft: 0 },
            };
          }
          return {
            ...s,
            sessionTimer: { ...s.sessionTimer, secsLeft: s.sessionTimer.secsLeft - 1 },
          };
        });
      }, 1000);
    } else {
      clearSessionTick();
    }
    return clearSessionTick;
  }, [state.sessionTimer.running]);

  const startSession = () => {
    setState((s) => ({
      ...s,
      sessionTimer: { ...s.sessionTimer, running: true },
    }));
  };

  const pauseSession = () => {
    setState((s) => ({
      ...s,
      sessionTimer: { ...s.sessionTimer, running: false },
    }));
  };

  const resetSession = () => {
    setState((s) => ({
      ...s,
      sessionTimer: { secsLeft: SESSION_SEC, running: false },
    }));
  };

  const startFall = () => {
    clearFallTick();
    fallStartRef.current = performance.now();
    setFallRunning(true);
    setFallElapsed(0);
    fallTickRef.current = setInterval(() => {
      if (fallStartRef.current != null) {
        setFallElapsed((performance.now() - fallStartRef.current) / 1000);
      }
    }, 10);
  };

  const stopFall = () => {
    clearFallTick();
    setFallRunning(false);
    if (fallStartRef.current != null) {
      const elapsed = (performance.now() - fallStartRef.current) / 1000;
      updateTab(state.activeTab, { recordedFallTimeS: elapsed.toFixed(2) });
      setFallElapsed(elapsed);
    }
    fallStartRef.current = null;
  };

  const toggleRecording = async () => {
    try {
      if (cam.isRecording) {
        await cam.stop();
        if (cam.lastClipUri) {
          updateTab(state.activeTab, { videoUri: cam.lastClipUri });
        }
      } else {
        await cam.start();
      }
    } catch {
      /* cam.error surfaced below */
    }
  };

  const applyEstimate = () => {
    const dv = impulse.deltaVMps;
    const ct = impulse.contactTimeS;
    if (dv != null && ct != null && ct > 0) {
      updateTab(state.activeTab, {
        recordedFallTimeS: dv.toFixed(2),
        contactTimeS: ct.toFixed(3),
      });
      const refG = gForceNoBounce(dv, ct);
      setFrozenImpulse({
        deltaVMps: dv,
        contactTimeS: ct,
        peakMagnitudeMs2: impulse.peakMagnitudeMs2,
        referenceG: refG,
      });
      clearTransferTicker();
      setTransferSecsLeft(TRANSFER_WINDOW_SEC);
      transferTickRef.current = setInterval(() => {
        setTransferSecsLeft((s) => {
          if (s <= 1) {
            clearTransferTicker();
            setFrozenImpulse(null);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      void AccessibilityInfo.isScreenReaderEnabled()
        .then((on) => {
          if (on) {
            AccessibilityInfo.announceForAccessibility(
              `${TRANSFER_WINDOW_SEC} second window for copied sensor estimate`,
            );
          }
        })
        .catch(() => {});
    }
  };

  const uploadResults = async () => {
    setState((s) => ({ ...s, uploadStatus: 'uploading', uploadError: null }));
    try {
      const loc = await location.refresh();
      const payload = buildSubmitPayload(
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
      await submitParachuteActivity(payload);
      setState((s) => ({ ...s, uploadStatus: 'success', uploadError: null }));
    } catch (e) {
      setState((s) => ({
        ...s,
        uploadStatus: 'error',
        uploadError: e instanceof Error ? e.message : 'Upload failed',
      }));
    }
  };

  const saveLocally = async () => {
    setSavingLocal(true);
    try {
      const best = allRuns
        .filter((r) => r.finalVelocityMps != null)
        .sort((a, b) => (a.finalVelocityMps ?? 999) - (b.finalVelocityMps ?? 999))[0];
      const sessionId = await saveActivityResult({
        activityType: 'parachute',
        score: best?.finalVelocityMps != null ? Math.round(best.finalVelocityMps * 100) / 100 : 0,
        payload: {
          runs: allRuns,
          reflection: state.reflection,
          massKg: state.massKg,
          primaryMode: state.primaryMode,
          tabs: state.tabs,
        },
      });
      router.push(`/results/${sessionId}`);
    } finally {
      setSavingLocal(false);
    }
  };

  const canApply =
    impulse.deltaVMps != null && impulse.contactTimeS != null && impulse.contactTimeS > 0;

  const styles = useThemedStyles((t) => ({
    ...activityScreenStyles(t),
    countdown: {
      fontSize: t.typography.subtitle,
      fontWeight: '800' as const,
      color: t.colors.accent,
      marginBottom: t.spacing.sm,
      fontFamily: 'monospace',
    },
    chips: { flexDirection: 'row' as const, flexWrap: 'wrap', marginBottom: t.spacing.md },
    chip: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: t.colors.border,
      marginRight: t.spacing.sm,
      marginBottom: t.spacing.sm,
      backgroundColor: t.colors.surface,
    },
    chipOn: { backgroundColor: t.colors.surface, borderColor: t.colors.accent, borderWidth: 2 },
    chipText: { color: t.colors.text, fontWeight: '600' as const, fontSize: t.typography.caption },
    chipTextOn: { color: t.colors.accent, fontWeight: '800' as const },
    fallReadout: {
      fontSize: t.typography.title,
      fontWeight: '800' as const,
      color: t.colors.text,
      marginVertical: t.spacing.sm,
      fontFamily: 'monospace',
    },
    toggleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: t.spacing.sm,
      marginBottom: t.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    toggleLabel: {
      flex: 1,
      paddingRight: t.spacing.md,
      fontSize: t.typography.body,
      fontWeight: '600' as const,
      color: t.colors.text,
    },
    preview: {
      height: 220,
      borderRadius: t.radii.md,
      marginVertical: t.spacing.sm,
      overflow: 'hidden' as const,
    },
    banner: {
      padding: t.spacing.sm,
      marginBottom: t.spacing.sm,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.success,
      backgroundColor: t.colors.readoutBg,
    },
    bannerErr: { borderColor: t.colors.danger },
    graphToggleHint: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.md,
      lineHeight: 18,
    },
    transferBanner: {
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
      padding: t.spacing.md,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.readoutBg,
    },
    transferTitle: {
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
      color: t.colors.accent,
      marginBottom: t.spacing.xs,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
    },
    transferCountdown: {
      fontSize: t.typography.subtitle,
      fontWeight: '800' as const,
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    transferBody: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.sm,
      lineHeight: 18,
    },
    transferNumbers: {
      fontSize: t.typography.body,
      fontWeight: '600' as const,
      color: t.colors.text,
      lineHeight: 22,
    },
  }));

  return (
    <ExperimentScreen title="Parachute Drop Challenge">
      <ActivityCard title="Parachute Drop Challenge" live={state.sessionTimer.running}>
        <Text style={styles.countdown} accessibilityLiveRegion="polite">
          Session {formatSessionTime(state.sessionTimer.secsLeft)}
        </Text>
        <View style={styles.actions}>
          <Button
            title="Start"
            variant="secondary"
            onPress={startSession}
            disabled={state.sessionTimer.running}
          />
          <Button
            title="Pause"
            variant="secondary"
            onPress={pauseSession}
            disabled={!state.sessionTimer.running}
          />
          <Button title="Reset" variant="secondary" onPress={resetSession} />
        </View>

        <Text style={styles.meta}>
          Team: {teamName} · Member: {studentFirstName} · Year: {gradeLevel}
        </Text>

        <View style={styles.chips}>
          {TAB_KEYS.map((key) => {
            const on = state.activeTab === key;
            return (
              <Pressable
                key={key}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => setState((s) => ({ ...s, activeTab: key }))}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{TAB_LABELS[key]}</Text>
              </Pressable>
            );
          })}
        </View>

        <FormField
          label="Design name"
          value={activeTab.designName}
          onChangeText={(designName) => updateTab(state.activeTab, { designName })}
        />
        <FormField
          label="Drop height (m)"
          value={activeTab.dropHeightM}
          onChangeText={(dropHeightM) => updateTab(state.activeTab, { dropHeightM })}
          keyboardType="decimal-pad"
        />
        <FormField
          label="Predicted fall time (s)"
          value={activeTab.predictedFallTimeS}
          onChangeText={(predictedFallTimeS) => updateTab(state.activeTab, { predictedFallTimeS })}
          keyboardType="decimal-pad"
        />

        <Text style={styles.instr}>Fall stopwatch (0.01 s precision)</Text>
        <Text style={styles.fallReadout}>{fallElapsed.toFixed(2)} s</Text>
        <View style={styles.actions}>
          <Button
            title="Start fall"
            variant="secondary"
            onPress={startFall}
            disabled={fallRunning}
          />
          <Button
            title="Stop fall"
            variant="secondary"
            onPress={stopFall}
            disabled={!fallRunning}
          />
        </View>
        <FormField
          label="Recorded fall time (s)"
          value={activeTab.recordedFallTimeS}
          onChangeText={(recordedFallTimeS) => updateTab(state.activeTab, { recordedFallTimeS })}
          keyboardType="decimal-pad"
        />

        {activeTab.videoUri ? (
          <ParachuteSlowMotionReview
            videoUri={activeTab.videoUri}
            impactSpeedMps={calc.kinematics.finalVelocity}
            firstContactFrame={activeTab.firstContactFrame}
            stoppedFrame={activeTab.stoppedFrame}
            currentFrame={activeTab.currentReviewFrame}
            gForcePath={activeTab.gForcePath}
            tUpS={activeTab.tUpS}
            contactTimeS={activeTab.contactTimeS}
            primaryMode={state.primaryMode}
            onFrameChange={(currentReviewFrame) =>
              updateTab(state.activeTab, { currentReviewFrame })
            }
            onMarkFirstContact={(firstContactFrame) =>
              updateTab(state.activeTab, { firstContactFrame })
            }
            onMarkStopped={(stoppedFrame) => updateTab(state.activeTab, { stoppedFrame })}
            onGForcePathChange={(gForcePath) => updateTab(state.activeTab, { gForcePath })}
            onTUpChange={(tUpS) => updateTab(state.activeTab, { tUpS })}
            onContactTimeChange={(contactTimeS) => updateTab(state.activeTab, { contactTimeS })}
            onContactTimeFromVideo={(contactTimeS) => updateTab(state.activeTab, { contactTimeS })}
          />
        ) : (
          <>
            {cam.error ? <Text style={{ color: colors.danger }}>{cam.error}</Text> : null}
            <CameraView ref={cam.cameraRef} style={styles.preview} mode="video" facing="back" />
            <Button
              title={cam.isRecording ? 'Stop Recording' : 'Start Recording'}
              variant="accent"
              onPress={() => void toggleRecording()}
              disabled={recordingDisabled && !cam.isRecording}
              style={{ minHeight: 56 }}
            />
          </>
        )}

        {activeTab.videoUri ? (
          <Button
            title="Re-record video"
            variant="secondary"
            onPress={() =>
              updateTab(state.activeTab, {
                videoUri: null,
                firstContactFrame: null,
                stoppedFrame: null,
              })
            }
          />
        ) : null}

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>
            Primary school mode — show fall time and speed only
          </Text>
          <Switch
            value={state.primaryMode}
            onValueChange={(primaryMode) => setState((s) => ({ ...s, primaryMode }))}
            trackColor={{ false: colors.border, true: colors.accentMuted }}
            thumbColor={state.primaryMode ? colors.accent : colors.surface}
          />
        </View>

        {!state.primaryMode ? (
          <FormField
            label="Mass (kg)"
            value={state.massKg}
            onChangeText={(massKg) => setState((s) => ({ ...s, massKg }))}
            keyboardType="decimal-pad"
          />
        ) : null}

        <StatReadout label="Recorded fall time (s)" value={fmtCalc(calc.fallTime, 2)} />
        <StatReadout label="Final speed (m/s)" value={fmtCalc(calc.kinematics.finalVelocity, 2)} />

        {!state.primaryMode ? (
          <>
            <StatReadout
              label="Acceleration (m/s²)"
              value={fmtCalc(calc.kinematics.acceleration, 2)}
            />
            <StatReadout label="Net force (N)" value={fmtCalc(calc.kinematics.netForce, 2)} />
            <StatReadout label="Drag force (N)" value={fmtCalc(calc.kinematics.dragForce, 2)} />
            <StatReadout
              label="G-force"
              value={
                calc.gResult.gForce != null
                  ? `${fmtCalc(calc.gResult.gForce, 2)} g · ${calc.gResult.riskLabel ?? ''}`
                  : '—'
              }
            />
          </>
        ) : null}

        <ParachuteResultsTable
          runs={allRuns}
          reflection={state.reflection}
          onReflectionChange={setReflection}
        />

        {state.uploadStatus === 'success' ? (
          <View style={styles.banner}>
            <Text style={styles.p}>Upload successful.</Text>
            <Button
              title="View leaderboard"
              variant="accent"
              onPress={() => router.push('/activity/parachute-leaderboard')}
            />
          </View>
        ) : null}
        {state.uploadError ? (
          <View style={[styles.banner, styles.bannerErr]}>
            <Text style={[styles.p, { color: colors.danger }]}>{state.uploadError}</Text>
          </View>
        ) : null}

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Advanced sensors — live acceleration graphs</Text>
          <Switch
            value={showLiveGraphs}
            onValueChange={setShowLiveGraphs}
            trackColor={{ false: colors.border, true: colors.accentMuted }}
            thumbColor={showLiveGraphs ? colors.accent : colors.surface}
          />
        </View>

        {!showLiveGraphs ? (
          <Text style={styles.graphToggleHint}>
            Turn on for Phyphox-style acceleration charts and sensor impulse estimates.
          </Text>
        ) : null}

        {showLiveGraphs ? (
          <>
            {!useDmStream ? (
              <Text style={styles.p}>
                Charts show raw accelerometer until DeviceMotion is available.
                {dm.motionDenied ? ' Motion permission denied.' : ''}
              </Text>
            ) : null}
            <LinearAccelCharts x={plotX} y={plotY} z={plotZ} />
            <StatReadout
              label="Sensor rate (Hz)"
              value={(useDmStream ? dm.hz : accelRaw.hz).toFixed(0)}
            />
            <StatReadout label="Live |a|" value={plotMagLive.toFixed(2)} />
            <StatReadout label="Δv est. (m/s)" value={fmtOpt(impulse.deltaVMps, 3)} />
            <StatReadout label="Contact est. (s)" value={fmtOpt(impulse.contactTimeS, 3)} />
            <StatReadout label="Peak |a| (m/s²)" value={fmtOpt(impulse.peakMagnitudeMs2, 1)} />
            <Button
              title="Fill from sensor estimate"
              variant="secondary"
              onPress={applyEstimate}
              disabled={!canApply}
            />
            {frozenImpulse !== null && transferSecsLeft > 0 ? (
              <View style={styles.transferBanner}>
                <Text style={styles.transferTitle}>Captured from sensor</Text>
                <Text style={styles.transferCountdown}>{transferSecsLeft}s left</Text>
                <Text style={styles.transferNumbers}>
                  Δv: {frozenImpulse.deltaVMps.toFixed(3)} m/s{'\n'}
                  Contact: {frozenImpulse.contactTimeS.toFixed(3)} s{'\n'}
                  Ref. g: {frozenImpulse.referenceG.toFixed(2)} g
                </Text>
              </View>
            ) : null}
          </>
        ) : null}

        <View style={styles.actions}>
          <Button
            title={state.uploadStatus === 'uploading' ? 'Uploading…' : 'Upload results'}
            onPress={() => void uploadResults()}
            disabled={state.uploadStatus === 'uploading'}
          />
          <Button
            title={savingLocal ? 'Saving…' : 'Save locally'}
            variant="secondary"
            onPress={() => void saveLocally()}
            disabled={savingLocal}
          />
          <Button
            title="View leaderboard"
            variant="secondary"
            onPress={() => router.push('/activity/parachute-leaderboard')}
          />
          <Button title="Home" variant="secondary" onPress={() => router.back()} />
        </View>
      </ActivityCard>
    </ExperimentScreen>
  );
}

function fmtOpt(n: number | null, decimals: number): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(decimals);
}
