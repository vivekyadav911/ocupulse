import { DeviceMotion } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import {
  computeStats,
  estimateHz,
  magnitudesFrom,
  pushRingSample,
  targetHzFromIntervalMs,
  type TimestampedSample,
} from '../lib/sensors/ringBuffer';
import { linearAccelFromDeviceMotionMeasurement } from '../lib/sensors/linearAccelFromDeviceMotion';
import type { MotionSensorStats, Vec3 } from './useMotionSensor';

export type LinearAccelMotionSample = Vec3 & TimestampedSample & { usedGravityFallback: boolean };

const EMPTY_STATS: MotionSensorStats = { mean: 0, peak: 0, rms: 0 };

const DEFAULT_MS = 1000 / 60;

function vecMagnitude(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/** DeviceMotion-based linear accel (Phyphox “without g” style) + ring buffer. */
export function useDeviceMotionLinearAccel(intervalMs = DEFAULT_MS) {
  const listenerLabel = 'ocupulse/device-motion-linear-listener';

  const [available, setAvailable] = useState<boolean | null>(null);
  const [motionDenied, setMotionDenied] = useState(false);
  const [vec, setVec] = useState<Vec3>({ x: 0, y: 0, z: 0 });
  const [buffer, setBuffer] = useState<LinearAccelMotionSample[]>([]);
  const [series, setSeries] = useState<number[]>([]);
  const [stats, setStats] = useState<MotionSensorStats>(EMPTY_STATS);
  const [hz, setHz] = useState(0);
  const [lastUsedGravityFallback, setLastUsedGravityFallback] = useState(false);
  const bufferRef = useRef<LinearAccelMotionSample[]>([]);

  const targetHz = targetHzFromIntervalMs(intervalMs);

  useEffect(() => {
    bufferRef.current = [];
    setBuffer([]);
    setSeries([]);
    setStats(EMPTY_STATS);
    setHz(0);

    let sub: { remove: () => void } | null = null;
    let cancelled = false;

    if (__DEV__) {
      console.count(`${listenerLabel} mount`);
    }

    const attach = async () => {
      const perm = await DeviceMotion.requestPermissionsAsync();
      if (cancelled) return;

      const denied = perm.status === 'denied';
      setMotionDenied(denied);
      if (denied) {
        setAvailable(false);
        return;
      }

      const ok = await DeviceMotion.isAvailableAsync();
      if (cancelled) return;
      setAvailable(ok);

      if (!ok) return;

      DeviceMotion.setUpdateInterval(intervalMs);
      sub = DeviceMotion.addListener((measurement) => {
        const now = Date.now();
        const { vec: v, usedGravitySubtractionFallback } =
          linearAccelFromDeviceMotionMeasurement(measurement);
        const magnitude = vecMagnitude(v);

        const sample: LinearAccelMotionSample = {
          x: v.x,
          y: v.y,
          z: v.z,
          t: now,
          magnitude,
          usedGravityFallback: usedGravitySubtractionFallback,
        };
        setLastUsedGravityFallback(usedGravitySubtractionFallback);

        bufferRef.current = pushRingSample(bufferRef.current, sample, now);
        const next = bufferRef.current;

        setVec(v);
        setBuffer(next);
        const mags = magnitudesFrom(next);
        setSeries(mags);
        setStats(computeStats(mags));
        setHz(estimateHz(next.map((s) => s.t)));
      });
    };

    void attach();

    return () => {
      cancelled = true;
      sub?.remove();
      bufferRef.current = [];
      if (__DEV__) {
        console.count(`${listenerLabel} unmount`);
      }
    };
  }, [intervalMs]);

  const magnitude = vecMagnitude(vec);

  return {
    ...vec,
    magnitude,
    buffer,
    series,
    stats,
    hz,
    targetHz,
    intervalMs,
    available,
    motionDenied,
    lastUsedGravityFallback,
  };
}
