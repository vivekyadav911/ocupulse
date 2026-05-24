import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccelerometer } from './useAccelerometer';

const SAMPLE_MS = 5000;

/** Record accel magnitude peaks while the user waves the fan (phone in hand). */
export function useHandfanSampler() {
  const { magnitude } = useAccelerometer();
  const [sampling, setSampling] = useState(false);
  const [peakDeviation, setPeakDeviation] = useState(0);
  const samplesRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sampling) return;
    samplesRef.current.push(magnitude);
  }, [magnitude, sampling]);

  const finish = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSampling(false);
    const samples = samplesRef.current;
    if (samples.length < 2) {
      setPeakDeviation(0);
      return 0;
    }
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const peakDev = Math.max(...samples.map((s) => Math.abs(s - mean)));
    setPeakDeviation(peakDev);
    return peakDev;
  }, []);

  const startSample = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    samplesRef.current = [];
    setPeakDeviation(0);
    setSampling(true);
    timerRef.current = setTimeout(() => {
      finish();
    }, SAMPLE_MS);
  }, [finish]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { sampling, peakDeviation, startSample, finish, sampleMs: SAMPLE_MS };
}
