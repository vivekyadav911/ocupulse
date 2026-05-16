import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Button } from '../../components/Button';
import { StatReadout } from '../../components/StatReadout';
import { useLocation } from '../../hooks/useLocation';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

const REGION_DELTA = 0.012;

export default function MapsSpike() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((t) => ({
    wrap: { flex: 1, padding: t.spacing.md },
    h1: { fontSize: 20, fontWeight: '800', marginBottom: t.spacing.sm, color: t.colors.primary },
    addr: { marginBottom: t.spacing.sm, color: t.colors.muted, fontSize: 14 },
    chart: { borderRadius: 12 },
    map: { flex: 1, marginTop: t.spacing.md, borderRadius: 12 },
    mapPlaceholder: {
      flex: 1,
      marginTop: t.spacing.md,
      borderRadius: 12,
      backgroundColor: t.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      padding: t.spacing.md,
    },
    placeholderText: { color: t.colors.muted, textAlign: 'center' as const },
    spinner: { marginVertical: t.spacing.md },
    err: { marginTop: t.spacing.sm, color: t.colors.danger },
  }));
  const { coords, suburb, address, error, loading, refresh } = useLocation();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const region = coords
    ? {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: REGION_DELTA,
        longitudeDelta: REGION_DELTA,
      }
    : undefined;

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>GPS + Maps spike</Text>
      <StatReadout label="Suburb" value={suburb || (loading ? 'Locating…' : '—')} />
      <Text style={styles.addr}>{address || error || ''}</Text>
      <Button
        title={loading ? 'Refreshing…' : 'Refresh GPS'}
        onPress={refresh}
        disabled={loading}
      />

      {loading && !coords ? (
        <ActivityIndicator style={styles.spinner} color={colors.primary} />
      ) : null}

      {region ? (
        <MapView style={styles.map} region={region} showsUserLocation showsMyLocationButton>
          <Marker
            coordinate={{ latitude: coords!.lat, longitude: coords!.lng }}
            title={suburb || 'You are here'}
            description={address}
          />
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.placeholderText}>
            Grant location permission on a real device to drop the marker.
          </Text>
        </View>
      )}
    </View>
  );
}
