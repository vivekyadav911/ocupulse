import { useCallback, useEffect, useRef, useState } from 'react';
import { breathsPerMinuteFromPeaks } from '../lib/calc/breathRate';
import { useAccelerometer } from './useAccelerometer';

const WINDOW_MS = 30_000;
const PEAK_DEBOUNCE_MS = 800;
const Z_THRESHOLD = 0.08;

export function useBreathingMonitor() {
  const { z } = useAccelerometer();
  const [running, setRunning] = useState(false);
  const [peakTimesS, setPeakTimesS] = useState<number[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startMsRef = useRef(0);
  const lastPeakMsRef = useRef(0);
  const baselineRef = useRef(0);

  const reset = useCallback(() => {
    setRunning(false);
    setPeakTimesS([]);
    setElapsedMs(0);
    startMsRef.current = 0;
    lastPeakMsRef.current = 0;
    baselineRef.current = 0;
  }, []);

  const start = useCallback(() => {
    reset();
    startMsRef.current = Date.now();
    lastPeakMsRef.current = 0;
    baselineRef.current = z;
    setRunning(true);
  }, [reset, z]);

  useEffect(() => {
    if (!running) return;

    const now = Date.now();
    const elapsed = now - startMsRef.current;
    setElapsedMs(elapsed);

    if (elapsed >= WINDOW_MS) {
      setRunning(false);
      return;
    }

    baselineRef.current = baselineRef.current * 0.98 + z * 0.02;
    const delta = z - baselineRef.current;

    if (delta > Z_THRESHOLD && now - lastPeakMsRef.current > PEAK_DEBOUNCE_MS) {
      lastPeakMsRef.current = now;
      const tSec = elapsed / 1000;
      setPeakTimesS((prev) => [...prev, tSec]);
    }
  }, [z, running]);

  const bpm = breathsPerMinuteFromPeaks(peakTimesS, WINDOW_MS / 1000);
  const progress = Math.min(1, elapsedMs / WINDOW_MS);

  return {
    running,
    peakTimesS,
    bpm,
    progress,
    elapsedMs,
    windowMs: WINDOW_MS,
    start,
    reset,
  };
}
