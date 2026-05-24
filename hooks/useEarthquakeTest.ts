import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AccelSample } from '../lib/calc/earthquakeDisplacement';
import { SAMPLE_HZ } from '../lib/calc/earthquakeDisplacement';
import {
  DEFAULT_TEST_DURATION_SEC,
  type EarthquakeTestDurationSec,
} from '../lib/earthquake/sessionState';

export const HAPTIC_ON_MS = 200;
export const HAPTIC_OFF_MS = 100;
const HAPTIC_PULSE_MS = 50;
const TICK_MS = 100;
const SAMPLE_INTERVAL_MS = 1000 / SAMPLE_HZ;

export type EarthquakeTestPhase = 'idle' | 'running' | 'done';

export function useEarthquakeTest() {
  const [phase, setPhase] = useState<EarthquakeTestPhase>('idle');
  const [secsLeft, setSecsLeft] = useState(DEFAULT_TEST_DURATION_SEC);
  const [progress, setProgress] = useState(1);
  const [sampleCount, setSampleCount] = useState(0);
  const [activeDurationSec, setActiveDurationSec] =
    useState<EarthquakeTestDurationSec>(DEFAULT_TEST_DURATION_SEC);

  const samplesRef = useRef<AccelSample[]>([]);
  const recordingRef = useRef(false);
  const durationMsRef = useRef(DEFAULT_TEST_DURATION_SEC * 1000);
  const endAtRef = useRef(0);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hapticCycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticPulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (hapticCycleTimerRef.current) {
      clearTimeout(hapticCycleTimerRef.current);
      hapticCycleTimerRef.current = null;
    }
    if (hapticPulseTimerRef.current) {
      clearInterval(hapticPulseTimerRef.current);
      hapticPulseTimerRef.current = null;
    }
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
  }, []);

  const finishTest = useCallback(() => {
    recordingRef.current = false;
    clearTimers();
    setPhase('done');
    setSecsLeft(0);
    setProgress(0);
  }, [clearTimers]);

  const startHapticOnWindow = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hapticPulseTimerRef.current = setInterval(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, HAPTIC_PULSE_MS);
  }, []);

  const stopHapticOnWindow = useCallback(() => {
    if (hapticPulseTimerRef.current) {
      clearInterval(hapticPulseTimerRef.current);
      hapticPulseTimerRef.current = null;
    }
  }, []);

  const scheduleHapticCycle = useCallback(
    (onPhase: boolean) => {
      if (!recordingRef.current) return;

      if (onPhase) {
        startHapticOnWindow();
        hapticCycleTimerRef.current = setTimeout(() => {
          stopHapticOnWindow();
          scheduleHapticCycle(false);
        }, HAPTIC_ON_MS);
      } else {
        hapticCycleTimerRef.current = setTimeout(() => {
          scheduleHapticCycle(true);
        }, HAPTIC_OFF_MS);
      }
    },
    [startHapticOnWindow, stopHapticOnWindow],
  );

  useEffect(() => {
    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      if (!recordingRef.current) return;
      samplesRef.current.push({ x, y, z, t: Date.now() });
      setSampleCount(samplesRef.current.length);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const startTest = useCallback(
    (durationSec: EarthquakeTestDurationSec = DEFAULT_TEST_DURATION_SEC) => {
      const testMs = durationSec * 1000;
      durationMsRef.current = testMs;
      setActiveDurationSec(durationSec);

      clearTimers();
      samplesRef.current = [];
      setSampleCount(0);
      recordingRef.current = true;
      endAtRef.current = Date.now() + testMs;
      setPhase('running');
      setSecsLeft(durationSec);
      setProgress(1);

      scheduleHapticCycle(true);

      tickTimerRef.current = setInterval(() => {
        const remaining = Math.max(0, endAtRef.current - Date.now());
        setSecsLeft(Math.ceil(remaining / 1000));
        setProgress(remaining / durationMsRef.current);
        if (remaining <= 0) {
          finishTest();
        }
      }, TICK_MS);

      finishTimerRef.current = setTimeout(finishTest, testMs);
    },
    [clearTimers, finishTest, scheduleHapticCycle],
  );

  const cancelTest = useCallback(() => {
    finishTest();
  }, [finishTest]);

  const resetTest = useCallback(
    (durationSec: EarthquakeTestDurationSec = DEFAULT_TEST_DURATION_SEC) => {
      clearTimers();
      recordingRef.current = false;
      samplesRef.current = [];
      setSampleCount(0);
      durationMsRef.current = durationSec * 1000;
      setActiveDurationSec(durationSec);
      setPhase('idle');
      setSecsLeft(durationSec);
      setProgress(1);
    },
    [clearTimers],
  );

  return {
    phase,
    secsLeft,
    progress,
    sampleCount,
    activeDurationSec,
    samplesRef,
    startTest,
    cancelTest,
    resetTest,
  };
}
