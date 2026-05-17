import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

export type LocationCoords = { lat: number; lng: number };

/** Prefer suburb-style fields from reverse geocode (AU: district / subregion / city). */
export function suburbFromGeocode(place: Location.LocationGeocodedAddress | undefined): string {
  if (!place) return '';
  return place.district || place.subregion || place.city || place.name || place.region || '';
}

export type LocationSnapshot = {
  coords: LocationCoords;
  suburb: string;
  address: string;
};

export function useLocation() {
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [suburb, setSuburb] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (): Promise<LocationSnapshot | null> => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setCoords(null);
        return null;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const nextCoords = { lat, lng };
      setCoords(nextCoords);

      const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const g = geo[0];
      const suburbLabel = suburbFromGeocode(g);
      const nextAddress = g
        ? [suburbLabel, g.region, g.country].filter(Boolean).join(', ') ||
          `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setSuburb(suburbLabel);
      setAddress(nextAddress);
      return { coords: nextCoords, suburb: suburbLabel, address: nextAddress };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { coords, suburb, address, error, loading, refresh };
}

/** @deprecated Use `useLocation` */
export const useLocationHook = useLocation;
