import type { DeviceMotionMeasurement } from 'expo-sensors';

export type Vec3 = { x: number; y: number; z: number };

const GRAVITY = 9.80665;

/** Length of acceleration vector excluding timestamp. */
function vecMag(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Prefer platform-reported linear (user) acceleration when present.
 * When `acceleration` is null, approximate by subtracting estimated gravity from
 * `accelerationIncludingGravity` using Tait-Bryan beta/gamma (degrees) from Expo — same heuristic as typical web deviceorientation docs (approximate).
 */
export function linearAccelFromDeviceMotionMeasurement(measurement: DeviceMotionMeasurement): {
  vec: Vec3;
  usedGravitySubtractionFallback: boolean;
} {
  const direct = measurement.acceleration;
  if (direct !== null && direct !== undefined) {
    const { x, y, z } = direct;
    return { vec: { x, y, z }, usedGravitySubtractionFallback: false };
  }

  const aig = measurement.accelerationIncludingGravity;
  const { beta, gamma } = measurement.rotation;
  const br = (beta * Math.PI) / 180;
  const gr = (gamma * Math.PI) / 180;
  const gx = -GRAVITY * Math.cos(gr) * Math.sin(br);
  const gy = -GRAVITY * Math.sin(gr);
  const gz = -GRAVITY * Math.cos(gr) * Math.cos(br);

  return {
    vec: {
      x: aig.x - gx,
      y: aig.y - gy,
      z: aig.z - gz,
    },
    usedGravitySubtractionFallback: true,
  };
}

/** Magnitude of linear acceleration (m/s²). */
export function linearAccelMagnitude(measurement: DeviceMotionMeasurement): number {
  const { vec } = linearAccelFromDeviceMotionMeasurement(measurement);
  return vecMag(vec.x, vec.y, vec.z);
}
