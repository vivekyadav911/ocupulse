import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Text, TextInput, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { FormField } from '../../components/FormField';
import { SoundDbGauge } from '../../components/SoundDbGauge';
import { SoundPredictionPicker } from '../../components/SoundPredictionPicker';
import { SoundReferenceTable } from '../../components/SoundReferenceTable';
import { SoundResultsTable } from '../../components/SoundResultsTable';
import { SoundSummaryCard } from '../../components/SoundSummaryCard';
import { StemmMap } from '../../components/StemmMap';
import { useMicrophoneDb } from '../../hooks/useMicrophoneDb';
import { useLocation } from '../../hooks/useLocation';
import { useRecordingGate } from '../../hooks/useRecordingGate';
import { markerColorForPeakDb } from '../../lib/calc/soundLevel';
import { buildSoundSubmitPayload } from '../../lib/sound/buildSubmitPayload';
import {
  createInitialSoundSessionState,
  createSoundCapture,
  summarizeSoundSession,
  type SoundSessionState,
} from '../../lib/sound/sessionState';
import { saveActivityResult } from '../../services/activityWrite';
import { submitSoundActivity } from '../../services/stemmApi';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

function formatCaptureTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function SoundScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const teamName = useSessionStore((s) => s.teamName);
  const studentFirstName = useSessionStore((s) => s.studentFirstName);
  const gradeLevel = useSessionStore((s) => s.gradeLevel);

  const [state, setState] = useState<SoundSessionState>(createInitialSoundSessionState);
  const [labelModalVisible, setLabelModalVisible] = useState(false);
  const [pendingLabel, setPendingLabel] = useState('');
  const [pendingCaptureDb, setPendingCaptureDb] = useState<number | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const mic = useMicrophoneDb();
  const stopMicRef = useRef(mic.stop);
  stopMicRef.current = mic.stop;

  const {
    coords,
    suburb,
    address,
    error: locationError,
    refresh,
    loading: locating,
  } = useLocation();
  const { recordingDisabled } = useRecordingGate();

  const styles = useThemedStyles((t) => ({
    ...activityScreenStyles(t),
    banner: {
      padding: t.spacing.sm,
      marginBottom: t.spacing.sm,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.readoutBg,
    },
    bannerDanger: {
      borderColor: t.colors.danger,
    },
    bannerText: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      lineHeight: 18,
    },
    bannerDangerText: {
      color: t.colors.danger,
    },
    addr: { color: t.colors.muted, marginBottom: t.spacing.md },
    map: {
      height: 220,
      width: '100%' as const,
      borderRadius: t.radii.lg,
      marginTop: t.spacing.sm,
      marginBottom: t.spacing.md,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    mapTitle: {
      fontSize: t.typography.body,
      fontWeight: '800' as const,
      color: t.colors.text,
      marginTop: t.spacing.md,
    },
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
    uploadError: {
      color: t.colors.danger,
    },
    uploadSuccess: {
      color: t.colors.success,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center' as const,
      padding: t.spacing.lg,
    },
    modalCard: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radii.lg,
      padding: t.spacing.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    modalTitle: {
      fontSize: t.typography.subtitle,
      fontWeight: '800' as const,
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    modalHint: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.md,
      lineHeight: 18,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radii.md,
      padding: t.spacing.sm,
      color: t.colors.text,
      backgroundColor: t.colors.readoutBg,
      marginBottom: t.spacing.md,
    },
    modalActions: {
      flexDirection: 'row' as const,
      gap: t.spacing.sm,
    },
  }));

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void (async () => {
      await mic.requestPermission();
      await mic.startMetering();
    })();
    return () => {
      void stopMicRef.current();
    };
  }, []);

  const setReflection = useCallback((partial: Partial<SoundSessionState['reflection']>) => {
    setState((s) => ({ ...s, reflection: { ...s.reflection, ...partial } }));
  }, []);

  const setPendingPrediction = useCallback(
    (pendingPrediction: SoundSessionState['pendingPrediction']) => {
      mic.resetCapturePeak();
      setState((s) => ({ ...s, pendingPrediction }));
    },
    [mic.resetCapturePeak],
  );

  const summary = useMemo(() => summarizeSoundSession(state.captures), [state.captures]);

  const recentCaptures = useMemo(() => state.captures.slice(-5), [state.captures]);

  const mapRegion = useMemo(() => {
    if (recentCaptures.length > 0) {
      const c = recentCaptures[recentCaptures.length - 1]!;
      return {
        latitude: c.lat,
        longitude: c.lng,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      };
    }
    if (coords) {
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return {
      latitude: -37.81,
      longitude: 144.96,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [coords, recentCaptures]);

  const mapMarkers = useMemo(
    () =>
      recentCaptures.map((c) => ({
        id: c.id,
        latitude: c.lat,
        longitude: c.lng,
        pinColor: markerColorForPeakDb(c.peakDb),
        calloutTitle: c.actionLabel,
        calloutBody: `${Math.round(c.peakDb)} dB · ${formatCaptureTime(c.capturedAt)}`,
      })),
    [recentCaptures],
  );

  const beginCapture = async () => {
    if (mic.permissionDenied || recordingDisabled) return;

    if (state.captures.length > 0 && state.pendingPrediction == null) {
      Alert.alert(
        'Prediction required',
        'Choose louder or softer than your last capture before recording the next reading.',
      );
      return;
    }

    const outcomeDb = mic.capturePeakDb ?? mic.liveDb ?? null;
    if (outcomeDb == null || outcomeDb <= 0) {
      Alert.alert('No reading yet', 'Wait for the live meter to respond, then try again.');
      return;
    }

    setCapturing(true);
    try {
      const place = await refresh();
      const lat = place?.coords.lat ?? coords?.lat;
      const lng = place?.coords.lng ?? coords?.lng;
      if (lat == null || lng == null) {
        throw new Error('GPS fix required — enable location and try again.');
      }

      setPendingCaptureDb(Math.round(outcomeDb));
      setPendingCoords({
        lat,
        lng,
        address: place?.address ?? address ?? undefined,
      });
      setPendingLabel('');
      setLabelModalVisible(true);
    } catch (e) {
      Alert.alert('Capture failed', e instanceof Error ? e.message : 'Could not capture reading.');
    } finally {
      setCapturing(false);
    }
  };

  const confirmCaptureLabel = () => {
    const label = pendingLabel.trim();
    if (!label) {
      Alert.alert(
        'Action label required',
        'Describe what made the sound (e.g. "dropping a book").',
      );
      return;
    }
    if (pendingCaptureDb == null) {
      setLabelModalVisible(false);
      return;
    }

    const lat = pendingCoords?.lat ?? coords?.lat;
    const lng = pendingCoords?.lng ?? coords?.lng;
    if (lat == null || lng == null) {
      Alert.alert('Location required', 'Enable GPS to tag this reading.');
      return;
    }

    const previousPeakDb =
      state.captures.length > 0 ? state.captures[state.captures.length - 1]!.peakDb : null;
    const prediction = state.captures.length === 0 ? null : state.pendingPrediction;

    const capture = createSoundCapture({
      actionLabel: label,
      peakDb: pendingCaptureDb,
      lat,
      lng,
      address: pendingCoords?.address ?? address ?? undefined,
      prediction,
      previousPeakDb,
    });

    setState((s) => ({
      ...s,
      captures: [...s.captures, capture],
      pendingPrediction: null,
    }));
    mic.resetCapturePeak();
    setLabelModalVisible(false);
    setPendingCaptureDb(null);
    setPendingCoords(null);
    setPendingLabel('');
  };

  const uploadResults = async () => {
    if (state.captures.length === 0) {
      Alert.alert('Nothing to upload', 'Capture at least one reading first.');
      return;
    }

    setUploading(true);
    setState((s) => ({ ...s, uploadStatus: 'uploading', uploadError: null }));
    try {
      const payload = buildSoundSubmitPayload(state.captures, state.reflection, {
        teamName,
        memberName: studentFirstName,
        gradeLevel,
      });
      await submitSoundActivity(payload);

      const sessionSummary = summarizeSoundSession(state.captures);
      await saveActivityResult({
        activityType: 'sound',
        score: sessionSummary?.avgDb ?? 0,
        payload: {
          peakDb: Math.max(...state.captures.map((c) => c.peakDb)),
          avgDb: sessionSummary?.avgDb ?? 0,
          lat: state.captures[0]!.lat,
          lng: state.captures[0]!.lng,
          address: state.captures[0]!.address ?? '',
          captures: state.captures.map((c) => ({
            actionLabel: c.actionLabel,
            prediction: c.prediction,
            peakDb: c.peakDb,
            lat: c.lat,
            lng: c.lng,
            address: c.address,
            capturedAt: c.capturedAt,
            predictionCorrect: c.predictionCorrect,
          })),
          reflection: state.reflection,
          summary: sessionSummary ?? undefined,
        },
      });

      setState((s) => ({ ...s, uploadStatus: 'success', uploadError: null }));
      setReviewModalVisible(false);
      router.replace('/(tabs)/leaderboard?activity=sound');
    } catch (e) {
      setState((s) => ({
        ...s,
        uploadStatus: 'error',
        uploadError: e instanceof Error ? e.message : 'Upload failed',
      }));
    } finally {
      setUploading(false);
    }
  };

  const captureBlocked = recordingDisabled || mic.permissionDenied || !mic.recording || capturing;

  return (
    <ExperimentScreen>
      <ActivityCard title="Sound Pollution Hunter" live={mic.recording}>
        {mic.sessionError ? (
          <View style={[styles.banner, styles.bannerDanger]}>
            <Text style={[styles.bannerText, styles.bannerDangerText]}>{mic.sessionError}</Text>
          </View>
        ) : null}

        {mic.permissionDenied ? (
          <View style={[styles.banner, styles.bannerDanger]}>
            <Text style={[styles.bannerText, styles.bannerDangerText]}>
              Microphone permission denied — enable it in Settings, then return here.
            </Text>
          </View>
        ) : null}

        {locationError ? (
          <View style={[styles.banner, styles.bannerDanger]}>
            <Text style={[styles.bannerText, styles.bannerDangerText]}>{locationError}</Text>
          </View>
        ) : null}

        {recordingDisabled ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Battery below 10% — charge the device before capturing readings.
            </Text>
          </View>
        ) : null}

        <SoundDbGauge liveDb={mic.liveDb} peakDb={mic.peakDb} recording={mic.recording} />

        <SoundPredictionPicker
          value={state.pendingPrediction}
          onChange={setPendingPrediction}
          disabled={state.captures.length === 0}
        />

        <View style={styles.actions}>
          <Button
            title={capturing ? 'Capturing…' : 'Capture reading'}
            onPress={() => void beginCapture()}
            disabled={captureBlocked}
          />
          <Button
            title="View all sound map"
            variant="accent"
            icon="map-outline"
            onPress={() => router.push('/results/sound-map')}
          />
        </View>

        <Text style={styles.addr}>
          {locating
            ? 'Locating…'
            : suburb
              ? `${suburb} · ${address || '—'}`
              : address || 'No address yet'}
        </Text>

        <SoundReferenceTable liveDb={mic.liveDb} />

        <SoundResultsTable captures={state.captures} />

        <Text style={styles.mapTitle}>
          Session map{state.captures.length > 5 ? ' (last 5 captures)' : ''}
        </Text>
        <StemmMap
          style={styles.map}
          initialRegion={mapRegion}
          showsUserLocation
          markers={mapMarkers}
        />

        <SoundSummaryCard summary={summary} />

        <Text style={styles.reflectionTitle}>Reflection</Text>
        <FormField
          label="Any surprises?"
          value={state.reflection.surprises}
          onChangeText={(surprises) => setReflection({ surprises })}
          multiline
          style={styles.multiline}
        />
        <FormField
          label="Ear muff recommendation?"
          value={state.reflection.earMuffRecommendation}
          onChangeText={(earMuffRecommendation) => setReflection({ earMuffRecommendation })}
          multiline
          style={styles.multiline}
        />

        <View style={styles.actions}>
          <Button
            title={uploading ? 'Publishing…' : 'Review map & publish to Leaderboard'}
            variant="secondary"
            icon="bar-chart-outline"
            onPress={() => setReviewModalVisible(true)}
            disabled={uploading || state.captures.length === 0}
          />
        </View>

        {state.uploadStatus === 'success' ? (
          <Text style={[styles.uploadStatus, styles.uploadSuccess]}>
            Published to Leaderboard — results saved locally too.
          </Text>
        ) : null}
        {state.uploadStatus === 'error' && state.uploadError ? (
          <Text style={[styles.uploadStatus, styles.uploadError]}>{state.uploadError}</Text>
        ) : null}
      </ActivityCard>

      <Modal visible={reviewModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>Review session map</Text>
            <Text style={styles.modalHint}>
              Check your last {Math.min(recentCaptures.length, 5)} capture
              {recentCaptures.length === 1 ? '' : 's'} on the map, then publish to the Leaderboard.
            </Text>
            <StemmMap style={styles.map} initialRegion={mapRegion} markers={mapMarkers} />
            {summary ? (
              <Text style={styles.modalHint}>
                Avg {summary.avgDb} dB · Loudest: {summary.loudestAction} · Quietest:{' '}
                {summary.quietestAction}
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setReviewModalVisible(false)}
                disabled={uploading}
              />
              <Button
                title={uploading ? 'Publishing…' : 'Publish to Leaderboard'}
                icon="bar-chart-outline"
                onPress={() => void uploadResults()}
                disabled={uploading}
              />
            </View>
            {state.uploadStatus === 'error' && state.uploadError ? (
              <Text style={[styles.uploadStatus, styles.uploadError]}>{state.uploadError}</Text>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={labelModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>What action caused this sound?</Text>
            <Text style={styles.modalHint}>
              {pendingCaptureDb != null
                ? `Peak reading: ${pendingCaptureDb} dB — describe the action (e.g. "dropping a book").`
                : 'Describe the action.'}
            </Text>
            <TextInput
              value={pendingLabel}
              onChangeText={setPendingLabel}
              placeholder="Action label"
              placeholderTextColor={colors.muted}
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setLabelModalVisible(false);
                  setPendingCaptureDb(null);
                  setPendingCoords(null);
                }}
              />
              <Button title="Save capture" onPress={confirmCaptureLabel} />
            </View>
          </View>
        </View>
      </Modal>
    </ExperimentScreen>
  );
}
