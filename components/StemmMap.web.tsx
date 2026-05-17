import { Text, View } from 'react-native';
import type { StemmMapMarker, StemmMapProps } from './StemmMap.types';

function boundsForMarkers(markers: StemmMapMarker[], region: StemmMapProps['initialRegion']) {
  const latitudes = markers.map((m) => m.latitude);
  const longitudes = markers.map((m) => m.longitude);
  const latMin = Math.min(
    region.latitude - region.latitudeDelta / 2,
    ...(latitudes.length ? latitudes : [region.latitude]),
  );
  const latMax = Math.max(
    region.latitude + region.latitudeDelta / 2,
    ...(latitudes.length ? latitudes : [region.latitude]),
  );
  const lngMin = Math.min(
    region.longitude - region.longitudeDelta / 2,
    ...(longitudes.length ? longitudes : [region.longitude]),
  );
  const lngMax = Math.max(
    region.longitude + region.longitudeDelta / 2,
    ...(longitudes.length ? longitudes : [region.longitude]),
  );
  return { latMin, latMax, lngMin, lngMax };
}

export function StemmMap({ style, initialRegion, markers }: StemmMapProps) {
  const { latMin, latMax, lngMin, lngMax } = boundsForMarkers(markers, initialRegion);
  const latSpan = latMax - latMin || 0.0001;
  const lngSpan = lngMax - lngMin || 0.0001;

  return (
    <View
      style={[
        style,
        {
          backgroundColor: '#dce6f2',
          borderRadius: 12,
          overflow: 'hidden',
          minHeight: 200,
          position: 'relative',
        },
      ]}
    >
      {markers.map((m) => {
        const left = ((m.longitude - lngMin) / lngSpan) * 100;
        const top = (1 - (m.latitude - latMin) / latSpan) * 100;
        return (
          <View
            key={m.id}
            accessibilityLabel={m.title ?? 'Map marker'}
            style={{
              position: 'absolute',
              left: `${Math.min(96, Math.max(2, left))}%`,
              top: `${Math.min(92, Math.max(4, top))}%`,
              marginLeft: -11,
              marginTop: -11,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: m.pinColor,
                borderWidth: 2,
                borderColor: '#fff',
              }}
            />
          </View>
        );
      })}
      <Text
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          right: 8,
          fontSize: 11,
          color: '#4a5d73',
          textAlign: 'center',
        }}
      >
        Map preview in browser — use the list for sample details.
      </Text>
    </View>
  );
}
