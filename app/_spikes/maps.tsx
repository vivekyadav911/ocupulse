import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Button } from '../../components/Button';
import { useLocationHook } from '../../hooks/useLocation';
import { colors, spacing } from '../../theme/tokens';

export default function MapsSpike() {
  const loc = useLocationHook();
  useEffect(() => {
    void loc.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={styles.wrap}>
      <Text style={styles.t}>{loc.address || loc.error || '…'}</Text>
      <Button title="Refresh GPS" onPress={loc.refresh} />
      {loc.coords ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: loc.coords.lat,
            longitude: loc.coords.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{ latitude: loc.coords.lat, longitude: loc.coords.lng }}
            title={loc.address}
          />
        </MapView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.md },
  t: { marginBottom: spacing.sm, color: colors.text },
  map: { flex: 1, marginTop: spacing.md, borderRadius: 12 },
});
