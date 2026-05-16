import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatReadout } from '../../components/StatReadout';
import { useMicrophoneDb } from '../../hooks/useMicrophoneDb';
import { useLocation } from '../../hooks/useLocation';
import { useRecordingGate } from '../../hooks/useRecordingGate';
import { markerColorForPeakDb } from '../../lib/sound/markerColor';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

const DURATION_MS = 30_000;

export default function SoundScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const styles = useThemedStyles(activityScreenStyles);
  const { recordingDisabled } = useRecordingGate();
  const { start: startMic, stop: stopMic, liveDb, peakDb, avgDb } = useMicrophoneDb();
  const { coords, address, refresh, loading: locating } = useLocation();
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishing = useRef(false);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const finishSample = async () => {
    if (finishing.current) return;
    finishing.current = true;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    setRunning(false);
    setSaving(true);
    try {
      const levels = await stopMic();
      const place = await refresh();
      const lat = place?.coords.lat ?? coords?.lat;
      const lng = place?.coords.lng ?? coords?.lng;
      if (lat == null || lng == null) {
        throw new Error('GPS fix required — enable location and try again.');
      }

      const resolvedAddress = place?.address ?? address;
      const finalPeak = levels.peakDb;
      const finalAvg = levels.avgDb;

      const sessionId = await writeSessionOptimistic({
        activityType: 'sound',
        teamName: team,
        score: Math.min(100, finalPeak),
        payload: {
          peakDb: finalPeak,
          avgDb: finalAvg,
          lat,
          lng,
          address: resolvedAddress,
        },
      });
      router.push(`/results/${sessionId}`);
    } finally {
      setSaving(false);
      finishing.current = false;
    }
  };

  const begin = async () => {
    finishing.current = false;
    setRunning(true);
    await refresh();
    await startMic();
    timer.current = setTimeout(() => {
      void finishSample();
    }, DURATION_MS);
  };

  const previewDb = running ? liveDb : peakDb;
  const pinColor = markerColorForPeakDb(previewDb);

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.title}>Sound Pollution Hunter</Text>
        <StatReadout
          label={running ? 'Live dB (approx)' : 'Peak dB (last sample)'}
          value={`${Math.round(previewDb)} dB`}
        />
        <StatReadout label="Avg dB" value={`${Math.round(avgDb)} dB`} />
        <Text style={styles.addr}>{locating ? 'Locating…' : address || 'No address yet'}</Text>
        <Button
          title={saving ? 'Saving…' : running ? 'Recording 30 s…' : 'Record 30 s sample'}
          onPress={begin}
          disabled={running || saving || recordingDisabled}
        />
        <Button
          title="Stop & save"
          variant="secondary"
          onPress={() => void finishSample()}
          disabled={!running || saving}
        />
        <Button
          title="View sound map"
          variant="secondary"
          onPress={() => router.push('/results/sound-map')}
        />
        {coords ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: coords.lat,
              longitude: coords.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} title={address}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: pinColor,
                  borderWidth: 2,
                  borderColor: '#fff',
                }}
              />
            </Marker>
          </MapView>
        ) : null}
      </Card>
    </View>
  );
}
