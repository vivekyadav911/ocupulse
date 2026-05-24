import type { StyleProp, ViewStyle } from 'react-native';

export type StemmMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type StemmMapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  pinColor: string;
  title?: string;
  description?: string;
  calloutTitle?: string;
  calloutBody?: string;
};

export type StemmMapType = 'standard' | 'satellite' | 'hybrid';

export type StemmMapProps = {
  style?: StyleProp<ViewStyle>;
  initialRegion: StemmMapRegion;
  markers: StemmMapMarker[];
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  mapType?: StemmMapType;
};
