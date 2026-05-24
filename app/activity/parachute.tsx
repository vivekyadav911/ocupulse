import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { ActivityErrorBoundary } from '../../components/ActivityErrorBoundary';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { FormField } from '../../components/FormField';
import {
  ParachuteAdvancedSensors,
  type SensorImpulseFill,
} from '../../components/ParachuteAdvancedSensors';
import { ParachuteCameraSection } from '../../components/ParachuteCameraSection';
import { ParachuteResultsTable } from '../../components/ParachuteResultsTable';
import { ParachuteSlowMotionReview } from '../../components/ParachuteSlowMotionReview';
import { StatReadout } from '../../components/StatReadout';
import { useLocation } from '../../hooks/useLocation';
import { fmtCalc, parsePositive } from '../../lib/calc/parachuteCalc';
import {
  createInitialChallengeState,
  SESSION_SEC,
  TAB_KEYS,
  TAB_LABELS,
  type ChallengeState,
  type TabData,
  type TabKey,
} from '../../lib/parachute/challengeState';
import { persistDraftVideo } from '../../lib/parachute/persistDraftVideo';
import {
  activeTabCalc,
  buildSubmitPayload,
  formatSessionTime,
  summarizeAllRuns,
} from '../../lib/parachute/runSummary';
import { saveActivityResult } from '../../services/activityWrite';
import { submitParachuteActivity } from '../../services/stemmApi';
import { parachuteScopeKey, useParachuteDraftStore } from '../../store/parachuteDraftStore';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

export default function ParachuteScreen() {
  return (
    <ActivityErrorBoundary>
      <ParachuteScreenInner />
    </ActivityErrorBoundary>
  );
}

function ParachuteScreenInner() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const teamName = useSessionStore((s) => s.teamName);
  const studentFirstName = useSessionStore((s) => s.studentFirstName);
  const gradeLevel = useSessionStore((s) => s.gradeLevel);
  const teamId = useSessionStore((s) => s.teamId);
  const studentId = useSessionStore((s) => s.studentId);
  const scopeKey = parachuteScopeKey(teamId, studentId);
  const setDraft = useParachuteDraftStore((s) => s.setDraft);
  const clearDraft = useParachuteDraftStore((s) => s.clearDraft);

  const [state, setState] = useState<ChallengeState>(createInitialChallengeState);
  const [draftRestored, setDraftRestored] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const activeTab = state.tabs[state.activeTab];

  const sessionTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallStartRef = useRef<number | null>(null);
  const draftSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fallElapsed, setFallElapsed] = useState(0);
  const [fallRunning, setFallRunning] = useState(false);
  const [showLiveGraphs, setShowLiveGraphs] = useState(false);
  const [savingLocal, setSavingLocal] = useState(false);

  const location = useLocation();
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

  useEffect(() => {
    const applyDraft = () => {
      const restored = useParachuteDraftStore.getState().getDraftForScope(scopeKey);
      if (restored) {
        setState(restored);
        setDraftRestored(true);
      }
      setHydrated(true);
    };

    if (useParachuteDraftStore.persist.hasHydrated()) {
      applyDraft();
    } else {
      const unsub = useParachuteDraftStore.persist.onFinishHydration(applyDraft);
      return () => {
        unsub();
        clearSessionTick();
        clearFallTick();
        if (draftSaveRef.current) clearTimeout(draftSaveRef.current);
      };
    }

    return () => {
      clearSessionTick();
      clearFallTick();
      if (draftSaveRef.current) clearTimeout(draftSaveRef.current);
    };
  }, [scopeKey]);

  useEffect(() => {
    if (!hydrated) return;
    if (draftSaveRef.current) clearTimeout(draftSaveRef.current);
    draftSaveRef.current = setTimeout(() => {
      setDraft(scopeKey, state);
    }, 500);
    return () => {
      if (draftSaveRef.current) clearTimeout(draftSaveRef.current);
    };
  }, [hydrated, scopeKey, setDraft, state]);

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

  const startNewSession = () => {
    Alert.alert(
      'Start new session?',
      'This clears all tabs, videos, and reflection for this challenge. Saved or uploaded results are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New session',
          style: 'destructive',
          onPress: () => {
            clearDraft();
            setState(createInitialChallengeState());
            setDraftRestored(false);
            setFallElapsed(0);
            setFallRunning(false);
            clearFallTick();
            fallStartRef.current = null;
          },
        },
      ],
    );
  };

  const handleVideoRecorded = useCallback(
    async (videoUri: string) => {
      const stableUri = await persistDraftVideo(videoUri, scopeKey, state.activeTab);
      updateTab(state.activeTab, { videoUri: stableUri ?? videoUri });
    },
    [scopeKey, state.activeTab, updateTab],
  );

  const applySensorEstimate = useCallback((estimate: SensorImpulseFill) => {
    setState((s) => {
      const tabKey = s.activeTab;
      const tab = s.tabs[tabKey];
      const height = parsePositive(tab.dropHeightM);
      const impact = parsePositive(estimate.impactSpeedMps);
      const hasStopwatch = parsePositive(tab.recordedFallTimeS) != null;

      const partial: Partial<TabData> = {
        contactTimeS: estimate.contactTimeS,
      };

      if (!hasStopwatch && height != null && impact != null && impact > 0) {
        partial.recordedFallTimeS = (height / impact).toFixed(2);
      }

      if (!s.primaryMode) {
        partial.gForcePath = 'noBounce';
      }

      return {
        ...s,
        tabs: {
          ...s.tabs,
          [tabKey]: { ...tab, ...partial },
        },
      };
    });
  }, []);

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
      clearDraft();
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
      clearDraft();
      router.push(`/results/${sessionId}`);
    } finally {
      setSavingLocal(false);
    }
  };

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
    toggleRowHighlight: {
      backgroundColor: t.colors.readoutBg,
      borderRadius: t.radii.md,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.md,
      marginBottom: t.spacing.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderBottomWidth: 1,
    },
    toggleLabel: {
      flex: 1,
      paddingRight: t.spacing.md,
      fontSize: t.typography.body,
      fontWeight: '600' as const,
      color: t.colors.text,
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
    draftBanner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      padding: t.spacing.sm,
      marginBottom: t.spacing.sm,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.accent,
      backgroundColor: t.colors.readoutBg,
    },
    draftBannerText: {
      flex: 1,
      fontSize: t.typography.caption,
      color: t.colors.text,
      marginRight: t.spacing.sm,
    },
    graphToggleHint: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.md,
      lineHeight: 18,
    },
  }));

  return (
    <ExperimentScreen title="Parachute Drop Challenge">
      <ActivityCard title="Parachute Drop Challenge" live={state.sessionTimer.running}>
        <Text style={styles.countdown} accessibilityLiveRegion="polite">
          Session {formatSessionTime(state.sessionTimer.secsLeft)}
        </Text>
        {draftRestored ? (
          <View style={styles.draftBanner}>
            <Text style={styles.draftBannerText}>
              Draft restored — continue where you left off.
            </Text>
            <Button title="Dismiss" variant="secondary" onPress={() => setDraftRestored(false)} />
          </View>
        ) : null}

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
          <Button title="Reset timer" variant="secondary" onPress={resetSession} />
          <Button title="New session" variant="secondary" onPress={startNewSession} />
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
          <ParachuteCameraSection onRecorded={(videoUri) => void handleVideoRecorded(videoUri)} />
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

        <View style={[styles.toggleRow, styles.toggleRowHighlight]}>
          <Text style={styles.toggleLabel}>Advanced sensors — live acceleration graphs</Text>
          <Switch
            value={showLiveGraphs}
            onValueChange={setShowLiveGraphs}
            trackColor={{ false: '#64748B', true: colors.accent }}
            thumbColor={showLiveGraphs ? colors.textInverse : '#E2E8F0'}
            ios_backgroundColor="#64748B"
          />
        </View>

        {!showLiveGraphs ? (
          <Text style={styles.graphToggleHint}>
            Turn on for Phyphox-style acceleration charts and sensor impulse estimates.
          </Text>
        ) : null}

        {showLiveGraphs ? (
          <ParachuteAdvancedSensors
            dropHeightM={activeTab.dropHeightM}
            recordedFallTimeS={activeTab.recordedFallTimeS}
            onApplyEstimate={applySensorEstimate}
          />
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
