import { useEffect, useState } from 'react';
import { Gyroscope } from 'expo-sensors';

const DEFAULT_MS = 1000 / 60;

export function useGyroscope(intervalMs = DEFAULT_MS) {
  const [vec, setVec] = useState({ x: 0, y: 0, z: 0 });
  const [series, setSeries] = useState<number[]>([]);

  useEffect(() => {
    Gyroscope.setUpdateInterval(intervalMs);
    const sub = Gyroscope.addListener((v) => {
      setVec({ x: v.x, y: v.y, z: v.z });
      const mag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
      setSeries((s) => [...s.slice(-200), mag]);
    });
    return () => sub.remove();
  }, [intervalMs]);

  const magnitude = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
  return { ...vec, magnitude, series };
}
