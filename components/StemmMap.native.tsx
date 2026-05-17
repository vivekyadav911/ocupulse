import MapView, { Marker } from 'react-native-maps';
import { View } from 'react-native';
import type { StemmMapProps } from './StemmMap.types';

export function StemmMap({
  style,
  initialRegion,
  markers,
  showsUserLocation,
  showsMyLocationButton,
}: StemmMapProps) {
  return (
    <MapView
      style={style}
      initialRegion={initialRegion}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          title={m.title}
          description={m.description}
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
        </Marker>
      ))}
    </MapView>
  );
}
