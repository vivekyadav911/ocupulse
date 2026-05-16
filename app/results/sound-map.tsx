import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { markerColorForPeakDb } from '../../lib/sound/markerColor';
import type { SoundSample } from '../../lib/sound/types';
import { subscribeLeaderboard } from '../../services/firestore';
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
    wrap: { flex: 1, backgroundColor: t.colors.surfaceAlt },
    h1: { padding: t.spacing.md, fontSize: 20, fontWeight: '800' as const, color: t.colors.text },
    legend: { paddingHorizontal: t.spacing.md, color: t.colors.muted, marginBottom: t.spacing.sm },
    map: { height: 280, width: '100%' as const },
    row: {
      padding: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      borderBottomWidth: 1,
      borderColor: t.colors.muted,
      color: t.colors.text,
    },
    empty: { padding: t.spacing.md, color: t.colors.muted },
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
    return subscribeLeaderboard('sound', (rows) => {
      const remote = rows
        .map((row) => leaderRowToSoundSample(row))
        .filter((s): s is SoundSample => s != null);
      setRemoteMarkers(remote);
    });
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
    <View style={styles.wrap}>
      <Text style={styles.h1}>Sound samples map</Text>
      <Text style={styles.legend}>
        Green under 60 dB · Amber 60–85 · Red over 85 (SQLite + Firestore)
      </Text>
      <MapView style={styles.map} initialRegion={region}>
        {markers.map((m) => {
          const color = markerColorForPeakDb(m.peakDb);
          return (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.lat, longitude: m.lng }}
              title={`${Math.round(m.peakDb)} dB peak`}
              description={m.address || m.teamName}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: color,
                  borderWidth: 2,
                  borderColor: '#fff',
                }}
              />
            </Marker>
          );
        })}
      </MapView>
      <FlatList
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
    </View>
  );
}
