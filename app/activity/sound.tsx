import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatReadout } from '../../components/StatReadout';
import { useMicrophoneDb } from '../../hooks/useMicrophoneDb';
import { useLocationHook } from '../../hooks/useLocation';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { colors, spacing } from '../../theme/tokens';

const DURATION_MS = 30_000;

export default function SoundScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const { start, stop, peakDb, avgDb } = useMicrophoneDb();
  const { coords, address, refresh } = useLocationHook();
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const begin = async () => {
    setRunning(true);
    await start();
    timer.current = setTimeout(async () => {
      await stop();
      setRunning(false);
    }, DURATION_MS);
  };

  const save = async () => {
    if (!coords) {
      await refresh();
    }
    const sessionId = await writeSessionOptimistic({
      activityType: 'sound',
      teamName: team,
      score: Math.min(100, peakDb),
      payload: {
        peakDb,
        avgDb,
        lat: coords?.lat ?? 0,
        lng: coords?.lng ?? 0,
        address,
      },
    });
    router.push(`/results/${sessionId}`);
  };

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.title}>Sound Pollution Hunter</Text>
        <StatReadout label="Peak dB (approx)" value={`${Math.round(peakDb)} dB`} />
        <StatReadout label="Avg dB" value={`${Math.round(avgDb)} dB`} />
        <Text style={styles.addr}>{address || 'Locating…'}</Text>
        <Button
          title={running ? 'Recording…' : 'Record 30 s sample'}
          onPress={begin}
          disabled={running}
        />
        <Button title="Stop early" variant="secondary" onPress={stop} />
        <Button title="Save to Firestore" onPress={save} />
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
            <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} title={address} />
          </MapView>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt },
  title: { fontSize: 22, fontWeight: '800', marginBottom: spacing.md, color: colors.primary },
  addr: { color: colors.muted, marginBottom: spacing.sm },
  map: { width: '100%', height: 180, marginTop: spacing.md, borderRadius: 12 },
});
