import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { LeaderRow } from '../../services/firestore';
import { subscribeLeaderboard } from '../../services/firestore';
import { colors, spacing } from '../../theme/tokens';

export default function SoundMapScreen() {
  const [markers, setMarkers] = useState<LeaderRow[]>([]);

  useEffect(() => {
    return subscribeLeaderboard('sound', setMarkers);
  }, []);

  const region =
    markers[0]?.lat != null && markers[0]?.lng != null
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
      <MapView style={styles.map} initialRegion={region}>
        {markers.map((m) => {
          if (m.lat == null || m.lng == null) return null;
          const db = m.peakDb ?? m.score;
          const color = db > 85 ? '#E74C3C' : db > 60 ? '#F39C12' : '#2ECC71';
          return (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.lat, longitude: m.lng }}
              title={`${Math.round(db)} dB`}
              pinColor={color}
            />
          );
        })}
      </MapView>
      <FlatList
        data={markers}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Text style={styles.row}>
            {item.id.slice(0, 8)} —{' '}
            {item.peakDb != null ? `${Math.round(item.peakDb)} dB` : `${item.score}`}
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.surfaceAlt },
  h1: { padding: spacing.md, fontSize: 20, fontWeight: '800', color: colors.primary },
  map: { height: 260, width: '100%' },
  row: {
    padding: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
  },
});
