import { useEffect, useRef, useState } from 'react';
import {
  computeStats,
  estimateHz,
  magnitudesFrom,
  pushRingSample,
  targetHzFromIntervalMs,
  type TimestampedSample,
} from '../lib/sensors/ringBuffer';

export type Vec3 = { x: number; y: number; z: number };

export type MotionSensorSample = Vec3 & TimestampedSample;

export type MotionSensorStats = {
  mean: number;
  peak: number;
  rms: number;
};

const EMPTY_STATS: MotionSensorStats = { mean: 0, peak: 0, rms: 0 };
const GRAVITY = 9.80665;

export type MotionSensorKind = 'accelerometer' | 'gyroscope';

type MotionSensorOptions = {
  intervalMs: number;
  listenerLabel: string;
};

function vecMagnitude(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function readAccelerometer(event: DeviceMotionEvent): Vec3 | null {
  const acc = event.accelerationIncludingGravity ?? event.acceleration;
  if (!acc || acc.x == null) return null;
  return {
    x: acc.x / GRAVITY,
    y: (acc.y ?? 0) / GRAVITY,
    z: (acc.z ?? 0) / GRAVITY,
  };
}

/** DeviceMotion rotationRate is deg/s; expo-sensors gyro uses rad/s. */
function readGyroscope(event: DeviceMotionEvent): Vec3 | null {
  const rot = event.rotationRate;
  if (!rot || rot.alpha == null) return null;
  const deg2rad = Math.PI / 180;
  return {
    x: (rot.beta ?? 0) * deg2rad,
    y: (rot.gamma ?? 0) * deg2rad,
    z: (rot.alpha ?? 0) * deg2rad,
  };
}

export function useMotionSensor(
  kind: MotionSensorKind,
  { intervalMs, listenerLabel }: MotionSensorOptions,
) {
  const [vec, setVec] = useState<Vec3>({ x: 0, y: 0, z: 0 });
  const [buffer, setBuffer] = useState<MotionSensorSample[]>([]);
  const [series, setSeries] = useState<number[]>([]);
  const [stats, setStats] = useState<MotionSensorStats>(EMPTY_STATS);
  const [hz, setHz] = useState(0);
  const bufferRef = useRef<MotionSensorSample[]>([]);

  const targetHz = targetHzFromIntervalMs(intervalMs);

  useEffect(() => {
    bufferRef.current = [];
    setBuffer([]);
    setSeries([]);
    setStats(EMPTY_STATS);
    setHz(0);

    if (__DEV__) {
      console.count(`${listenerLabel} mount`);
    }

    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return;
    }

    const onMotion = (event: DeviceMotionEvent) => {
      const v = kind === 'accelerometer' ? readAccelerometer(event) : readGyroscope(event);
      if (!v) return;

      const now = Date.now();
      const magnitude = vecMagnitude(v);
      const sample: MotionSensorSample = { x: v.x, y: v.y, z: v.z, t: now, magnitude };
      const next = pushRingSample(bufferRef.current, sample, now);
      bufferRef.current = next;

      setVec({ x: v.x, y: v.y, z: v.z });
      setBuffer(next);
      const mags = magnitudesFrom(next);
      setSeries(mags);
      setStats(computeStats(mags));
      setHz(estimateHz(next.map((s) => s.t)));
    };

    window.addEventListener('devicemotion', onMotion);

    return () => {
      window.removeEventListener('devicemotion', onMotion);
      bufferRef.current = [];
      if (__DEV__) {
        console.count(`${listenerLabel} unmount`);
      }
    };
  }, [intervalMs, listenerLabel, kind]);

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
  };
}
