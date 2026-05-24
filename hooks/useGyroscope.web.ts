import { useMotionSensor } from './useMotionSensor.web';

const DEFAULT_MS = 1000 / 60;

/** Web: DeviceMotion rotationRate (no expo-sensors native module). */
export function useGyroscope(intervalMs = DEFAULT_MS) {
  return useMotionSensor('gyroscope', {
    intervalMs,
    listenerLabel: 'ocupulse/gyroscope-listener',
  });
}
