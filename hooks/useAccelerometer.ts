import { Accelerometer } from 'expo-sensors';
import { useMotionSensor } from './useMotionSensor';

const DEFAULT_MS = 1000 / 60;

export function useAccelerometer(intervalMs = DEFAULT_MS) {
  return useMotionSensor(Accelerometer, {
    intervalMs,
    listenerLabel: 'ocupulse/accelerometer-listener',
  });
}
