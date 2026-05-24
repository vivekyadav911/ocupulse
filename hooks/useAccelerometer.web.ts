import { useMotionSensor } from './useMotionSensor.web';

const DEFAULT_MS = 1000 / 60;

/** Web: DeviceMotion API (no expo-sensors native module). */
export function useAccelerometer(intervalMs = DEFAULT_MS) {
  return useMotionSensor('accelerometer', {
    intervalMs,
    listenerLabel: 'ocupulse/accelerometer-listener',
  });
}
