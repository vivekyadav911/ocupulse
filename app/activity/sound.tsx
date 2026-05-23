import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { SoundLevelChart } from '../../components/SoundLevelChart';
import { StatReadout } from '../../components/StatReadout';
import { StemmMap } from '../../components/StemmMap';
import { useMicrophoneDb } from '../../hooks/useMicrophoneDb';
import { useLocation } from '../../hooks/useLocation';
import { useRecordingGate } from '../../hooks/useRecordingGate';
import {
  markerColorForPeakDb,
  pollutionTierForPeakDb,
  pollutionTierLabel,
  type PollutionTier,
} from '../../lib/calc/soundLevel';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

const DURATION_MS = 30_000;
const DURATION_SEC = DURATION_MS / 1000;

function fmtDb(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${Math.round(n)} dB`;
}

export default function SoundScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const styles = useThemedStyles((t) => ({
    ...activityScreenStyles(t),
    tierRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: t.spacing.sm,
    },
    tierBadge: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: t.radii.xl,
      borderWidth: 1,
    },
    tierText: {
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
    },
    countdown: {
      fontSize: t.typography.subtitle,
      fontWeight: '800' as const,
      color: t.colors.accent,
      marginBottom: t.spacing.sm,
    },
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
      backgroundColor: t.colors.readoutBg,
    },
    bannerText: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      lineHeight: 18,
    },
    bannerDangerText: {
      color: t.colors.danger,
    },
  }));
  const { recordingDisabled } = useRecordingGate();
  const mic = useMicrophoneDb();
  const { start: startMic, stop: stopMic } = mic;
  const stopMicRef = useRef(stopMic);
  stopMicRef.current = stopMic;
  const {
    coords,
    suburb,
    address,
    error: locationError,
    refresh,
    loading: locating,
  } = useLocation();
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [secsLeft, setSecsLeft] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTick = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishing = useRef(false);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (countdownTick.current) clearInterval(countdownTick.current);
      void stopMicRef.current();
    };
  }, []);

  const clearTimers = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (countdownTick.current) {
      clearInterval(countdownTick.current);
      countdownTick.current = null;
    }
  };

  const tierStyles = (tier: PollutionTier) => {
    const color = markerColorForPeakDb(tier === 'quiet' ? 45 : tier === 'moderate' ? 70 : 90);
    return {
      badge: { borderColor: color, backgroundColor: `${color}22` },
      text: { color },
    };
  };

  const previewPeak = running ? mic.peakDb : mic.peakDb;
  const tierPeak = previewPeak ?? 0;
  const tier = pollutionTierForPeakDb(tierPeak);
  const tierStyle = tierStyles(tier);
  const pinColor = markerColorForPeakDb(tierPeak || 35);

  const finishSample = async () => {
    if (finishing.current) return;
    finishing.current = true;
    clearTimers();
    setRunning(false);
    setSecsLeft(0);
    setSaving(true);
    try {
      const levels = await stopMic();
      if (levels.sampleCount === 0) {
        throw new Error('No microphone samples — grant mic access and try again.');
      }

      const place = await refresh();
      const lat = place?.coords.lat ?? coords?.lat;
      const lng = place?.coords.lng ?? coords?.lng;
      if (lat == null || lng == null) {
        throw new Error('GPS fix required — enable location and try again.');
      }

      const resolvedAddress = place?.address ?? address;
      const pollutionTier = pollutionTierForPeakDb(levels.peakDb);

      const sessionId = await writeSessionOptimistic({
        activityType: 'sound',
        teamName: team,
        score: Math.min(100, levels.peakDb),
        payload: {
          peakDb: levels.peakDb,
          avgDb: levels.avgDb,
          lat,
          lng,
          address: resolvedAddress,
          sampleDurationSec: DURATION_SEC,
          sampleCount: levels.sampleCount,
          pollutionTier,
        },
      });
      router.push(`/results/${sessionId}`);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save sound sample.');
    } finally {
      setSaving(false);
      finishing.current = false;
    }
  };

  const begin = async () => {
    if (recordingDisabled) return;
    finishing.current = false;
    clearTimers();
    const started = await startMic();
    if (!started) {
      if (!mic.permissionDenied) {
        Alert.alert(
          'Microphone unavailable',
          mic.sessionError ??
            'Could not start audio capture. Try again on a physical device with no other audio apps open.',
        );
      } else {
        Alert.alert(
          'Microphone blocked',
          'Enable microphone access in Settings to measure sound levels.',
        );
      }
      return;
    }
    setRunning(true);
    setSecsLeft(DURATION_SEC);
    void refresh();

    countdownTick.current = setInterval(() => {
      setSecsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    timer.current = setTimeout(() => {
      void finishSample();
    }, DURATION_MS);
  };

  const recordBlocked = recordingDisabled || mic.permissionDenied;

  return (
    <ExperimentScreen>
      <ActivityCard title="Sound Pollution Hunter" live={running}>
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
              Battery below 10% — charge the device before recording.
            </Text>
          </View>
        ) : null}

        <SoundLevelChart history={mic.history} liveDb={mic.liveDb} recording={running} />

        {running ? (
          <Text style={styles.countdown} accessibilityLiveRegion="polite">
            {secsLeft}s remaining
          </Text>
        ) : null}

        <View style={styles.tierRow}>
          <StatReadout
            label={running ? 'Live dB (approx)' : 'Peak dB (last sample)'}
            value={fmtDb(running ? mic.liveDb : mic.peakDb)}
          />
          {previewPeak != null && previewPeak > 0 ? (
            <View style={[styles.tierBadge, tierStyle.badge]}>
              <Text style={[styles.tierText, tierStyle.text]}>{pollutionTierLabel(tier)}</Text>
            </View>
          ) : null}
        </View>

        <StatReadout label="Avg dB" value={fmtDb(mic.avgDb)} />
        <StatReadout label="Suburb" value={suburb || (locating ? 'Locating…' : '—')} />
        <Text style={styles.addr}>{locating ? 'Locating…' : address || 'No address yet'}</Text>

        <View style={styles.actions}>
          <Button
            title={saving ? 'Saving…' : running ? 'Recording 30 s…' : 'Record 30 s sample'}
            onPress={begin}
            disabled={running || saving || recordBlocked}
          />
          <Button
            title="Stop & save"
            variant="secondary"
            onPress={() => void finishSample()}
            disabled={!running || saving}
          />
          <Button
            title="View sound map"
            variant="accent"
            icon="map-outline"
            onPress={() => router.push('/results/sound-map')}
          />
        </View>

        {coords ? (
          <StemmMap
            style={styles.map}
            initialRegion={{
              latitude: coords.lat,
              longitude: coords.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            markers={[
              {
                id: 'preview',
                latitude: coords.lat,
                longitude: coords.lng,
                pinColor,
                title: address,
              },
            ]}
          />
        ) : null}
      </ActivityCard>
    </ExperimentScreen>
  );
}
