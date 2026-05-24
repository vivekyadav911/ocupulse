import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Text } from 'react-native';
import { PageTitle } from '../../components/PageTitle';
import { ScreenShell } from '../../components/ScreenShell';
import { StemmMap } from '../../components/StemmMap';
import { markerColorForPeakDb } from '../../lib/sound/markerColor';
import type { SoundSample } from '../../lib/sound/types';
import { subscribeLeaderboard } from '../../services/leaderboard';
import {
  leaderRowToSoundSample,
  loadSoundSamplesFromSqlite,
  mergeSoundSamples,
} from '../../services/soundSamples';
import { useThemedStyles } from '../../theme/themedStyles';

export default function SoundMapScreen() {
  const [localMarkers, setLocalMarkers] = useState<SoundSample[]>([]);
  const [remoteMarkers, setRemoteMarkers] = useState<SoundSample[]>([]);
  const styles = useThemedStyles((t) => ({
    legend: { color: t.colors.muted, marginBottom: t.spacing.sm },
    map: {
      height: 280,
      width: '100%' as const,
      borderRadius: t.radii.lg,
      overflow: 'hidden' as const,
      marginBottom: t.spacing.md,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    row: {
      padding: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      borderBottomWidth: 1,
      borderColor: t.colors.border,
      color: t.colors.text,
      backgroundColor: t.colors.surface,
    },
    empty: { color: t.colors.muted, marginTop: t.spacing.md },
    list: { flex: 1, minHeight: 120 },
  }));

  const reloadLocal = useCallback(async () => {
    setLocalMarkers(await loadSoundSamplesFromSqlite());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reloadLocal();
    }, [reloadLocal]),
  );

  useEffect(() => {
    const sub = subscribeLeaderboard('sound', (rows) => {
      const remote = rows
        .map((row) => leaderRowToSoundSample(row))
        .filter((s): s is SoundSample => s != null);
      setRemoteMarkers(remote);
    });
    return sub.unsubscribe;
  }, []);

  const markers = useMemo(
    () => mergeSoundSamples(localMarkers, remoteMarkers),
    [localMarkers, remoteMarkers],
  );

  const region =
    markers[0] != null
      ? {
          latitude: markers[0].lat,
          longitude: markers[0].lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : {
          latitude: -37.81,
          longitude: 144.96,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        };

  return (
    <ScreenShell scroll={false}>
      <PageTitle eyebrow="Sound data" title="Results map" />
      <Text style={styles.legend}>
        Green 0–60 · Amber 60–85 · Orange 85–100 · Red 100+ dB (SQLite + Firestore)
      </Text>
      <StemmMap
        style={styles.map}
        initialRegion={region}
        markers={markers.map((m) => ({
          id: m.id,
          latitude: m.lat,
          longitude: m.lng,
          pinColor: markerColorForPeakDb(m.peakDb),
          title: `${Math.round(m.peakDb)} dB peak`,
          description: m.address || m.teamName,
        }))}
      />
      <FlatList
        style={styles.list}
        data={markers}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No sound samples yet — record on Sound Hunter.</Text>
        }
        renderItem={({ item }) => (
          <Text style={styles.row}>
            {Math.round(item.peakDb)} dB peak · {Math.round(item.avgDb)} dB avg —{' '}
            {item.address || `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`}
          </Text>
        )}
      />
    </ScreenShell>
  );
}
