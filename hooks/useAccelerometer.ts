import { useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';

const DEFAULT_MS = 1000 / 60;

export function useAccelerometer(intervalMs = DEFAULT_MS) {
  const [vec, setVec] = useState({ x: 0, y: 0, z: 0 });
  const buf = useRef<{ x: number; y: number; z: number; t: number }[]>([]);

  useEffect(() => {
    Accelerometer.setUpdateInterval(intervalMs);
    const sub = Accelerometer.addListener((v) => {
      const now = Date.now();
      setVec({ x: v.x, y: v.y, z: v.z });
      buf.current = [...buf.current.slice(-300), { x: v.x, y: v.y, z: v.z, t: now }];
    });
    return () => sub.remove();
  }, [intervalMs]);

  const magnitude = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
  return { ...vec, magnitude, buffer: buf.current };
}
