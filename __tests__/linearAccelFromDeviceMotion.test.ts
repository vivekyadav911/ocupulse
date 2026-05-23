import type { DeviceMotionMeasurement } from 'expo-sensors';
import {
  linearAccelFromDeviceMotionMeasurement,
  linearAccelMagnitude,
} from '../lib/sensors/linearAccelFromDeviceMotion';

describe('linearAccelFromDeviceMotionMeasurement', () => {
  const baseMeas = (): DeviceMotionMeasurement => ({
    acceleration: null,
    accelerationIncludingGravity: { x: 0, y: 0, z: -9.80665, timestamp: 0 },
    rotation: { alpha: 0, beta: 0, gamma: 0, timestamp: 0 },
    rotationRate: null,
    interval: 16,
    orientation: 0,
  });

  it('uses native user acceleration when non-null', () => {
    const m = baseMeas();
    m.acceleration = { x: 1.5, y: -0.25, z: 3.0, timestamp: 0 };
    const { vec, usedGravitySubtractionFallback } = linearAccelFromDeviceMotionMeasurement(m);
    expect(usedGravitySubtractionFallback).toBe(false);
    expect(vec.x).toBeCloseTo(1.5);
    expect(vec.y).toBeCloseTo(-0.25);
    expect(vec.z).toBeCloseTo(3);
  });

  it('approximates linear accel when acceleration is null (device flat, −g along Z)', () => {
    const m = baseMeas();
    const { vec, usedGravitySubtractionFallback } = linearAccelFromDeviceMotionMeasurement(m);
    expect(usedGravitySubtractionFallback).toBe(true);
    expect(vec.x).toBeCloseTo(0, 1);
    expect(vec.y).toBeCloseTo(0, 1);
    expect(vec.z).toBeCloseTo(0, 1);
  });

  it('reports magnitude consistently', () => {
    const m = baseMeas();
    m.acceleration = { x: 3, y: 4, z: 0, timestamp: 0 };
    expect(linearAccelMagnitude(m)).toBeCloseTo(5);
  });
});
