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

type SensorModule = {
  setUpdateInterval: (ms: number) => void;
  addListener: (cb: (v: Vec3) => void) => { remove: () => void };
};

type MotionSensorOptions = {
  intervalMs: number;
  listenerLabel: string;
};

function vecMagnitude(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function useMotionSensor(
  sensor: SensorModule,
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

    sensor.setUpdateInterval(intervalMs);
    const sub = sensor.addListener((v) => {
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
    });

    return () => {
      sub.remove();
      bufferRef.current = [];
      if (__DEV__) {
        console.count(`${listenerLabel} unmount`);
      }
    };
  }, [intervalMs, listenerLabel, sensor]);

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
