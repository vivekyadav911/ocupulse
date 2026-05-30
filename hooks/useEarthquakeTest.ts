import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { AccelSample } from '../lib/calc/earthquakeDisplacement';
import { SAMPLE_HZ } from '../lib/calc/earthquakeDisplacement';
import {
  DEFAULT_TEST_DURATION_SEC,
  type EarthquakeTestDurationSec,
} from '../lib/earthquake/sessionState';

export const HAPTIC_ON_MS = 200;
export const HAPTIC_OFF_MS = 100;
const HAPTIC_PULSE_MS = 50;
const TICK_MS = 250;
const SAMPLE_INTERVAL_MS = 1000 / SAMPLE_HZ;

export type EarthquakeTestPhase = 'idle' | 'running';

export type EarthquakeTestCompleteHandler = (samples: readonly AccelSample[]) => void;

export function useEarthquakeTest(onComplete?: EarthquakeTestCompleteHandler) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [phase, setPhase] = useState<EarthquakeTestPhase>('idle');
  const [secsLeft, setSecsLeft] = useState(DEFAULT_TEST_DURATION_SEC);
  const [progress, setProgress] = useState(0);
  const [activeDurationSec, setActiveDurationSec] =
    useState<EarthquakeTestDurationSec>(DEFAULT_TEST_DURATION_SEC);

  const samplesRef = useRef<AccelSample[]>([]);
  const recordingRef = useRef(false);
  const finishedRef = useRef(false);
  const durationMsRef = useRef(DEFAULT_TEST_DURATION_SEC * 1000);
  const endAtRef = useRef(0);
  const tickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticCycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticPulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (tickTimerRef.current) {
      clearTimeout(tickTimerRef.current);
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
  }, []);

  const stopHapticOnWindow = useCallback(() => {
    if (hapticPulseTimerRef.current) {
      clearInterval(hapticPulseTimerRef.current);
      hapticPulseTimerRef.current = null;
    }
  }, []);

  const startHapticOnWindow = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hapticPulseTimerRef.current = setInterval(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, HAPTIC_PULSE_MS);
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

  const syncTick = useCallback(() => {
    if (!recordingRef.current || finishedRef.current) return;

    const remaining = Math.max(0, endAtRef.current - Date.now());
    const durationMs = durationMsRef.current;
    const secs = Math.max(0, Math.ceil(remaining / 1000));

    setSecsLeft(secs);
    setProgress(durationMs > 0 ? 1 - remaining / durationMs : 1);

    if (remaining <= 0) {
      finishedRef.current = true;
      recordingRef.current = false;
      clearTimers();
      stopHapticOnWindow();

      const samples = samplesRef.current.slice();
      samplesRef.current = [];
      const durationSec = Math.max(1, Math.round(durationMs / 1000)) as EarthquakeTestDurationSec;

      setPhase('idle');
      setSecsLeft(durationSec);
      setProgress(0);
      onCompleteRef.current?.(samples);
      return;
    }

    tickTimerRef.current = setTimeout(syncTick, TICK_MS);
  }, [clearTimers, stopHapticOnWindow]);

  useEffect(() => {
    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      if (!recordingRef.current) return;
      samplesRef.current.push({ x, y, z, t: Date.now() });
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next === 'active' && recordingRef.current && !finishedRef.current) {
        syncTick();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [syncTick]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const startTest = useCallback(
    (durationSec: EarthquakeTestDurationSec = DEFAULT_TEST_DURATION_SEC) => {
      const testMs = durationSec * 1000;
      durationMsRef.current = testMs;
      setActiveDurationSec(durationSec);

      clearTimers();
      stopHapticOnWindow();
      samplesRef.current = [];
      finishedRef.current = false;
      recordingRef.current = true;
      endAtRef.current = Date.now() + testMs;

      setPhase('running');
      setSecsLeft(durationSec);
      setProgress(0);

      scheduleHapticCycle(true);
      syncTick();
    },
    [clearTimers, scheduleHapticCycle, stopHapticOnWindow, syncTick],
  );

  const cancelTest = useCallback(() => {
    if (!recordingRef.current) return;
    finishedRef.current = true;
    recordingRef.current = false;
    clearTimers();
    stopHapticOnWindow();
    samplesRef.current = [];
    setPhase('idle');
    setProgress(0);
  }, [clearTimers, stopHapticOnWindow]);

  const resetTest = useCallback(
    (durationSec: EarthquakeTestDurationSec = DEFAULT_TEST_DURATION_SEC) => {
      clearTimers();
      stopHapticOnWindow();
      recordingRef.current = false;
      finishedRef.current = false;
      samplesRef.current = [];
      durationMsRef.current = durationSec * 1000;
      setActiveDurationSec(durationSec);
      setPhase('idle');
      setSecsLeft(durationSec);
      setProgress(0);
    },
    [clearTimers, stopHapticOnWindow],
  );

  return {
    phase,
    secsLeft,
    progress,
    activeDurationSec,
    samplesRef,
    startTest,
    cancelTest,
    resetTest,
  };
}
