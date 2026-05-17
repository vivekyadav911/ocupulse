import { Gyroscope } from 'expo-sensors';
import { useMotionSensor } from './useMotionSensor';

const DEFAULT_MS = 1000 / 60;

export function useGyroscope(intervalMs = DEFAULT_MS) {
  return useMotionSensor(Gyroscope, {
    intervalMs,
    listenerLabel: 'ocupulse/gyroscope-listener',
  });
}
