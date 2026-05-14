import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

export function useLocationHook() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Location permission denied');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    setCoords({ lat, lng });
    const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const g = geo[0];
    setAddress(
      g
        ? [g.street, g.city, g.region, g.country].filter(Boolean).join(', ')
        : `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    );
  }, []);

  return { coords, address, error, refresh };
}
