import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  aggregateAttempt,
  computeJerkMm,
  SAMPLE_HZ,
  type AccelSample,
} from '../lib/calc/humanperfJerk';
import {
  DEFAULT_ATTEMPT_DURATION_SEC,
  type HumanperfAttemptDurationSec,
} from '../lib/humanperf/sessionState';

const TICK_MS = 100;
const SAMPLE_INTERVAL_MS = 1000 / SAMPLE_HZ;

export type HumanperfAttemptPhase = 'idle' | 'recording' | 'done';

export function useHumanperfAttempt() {
  const [phase, setPhase] = useState<HumanperfAttemptPhase>('idle');
  const [secsLeft, setSecsLeft] = useState(DEFAULT_ATTEMPT_DURATION_SEC);
  const [progress, setProgress] = useState(1);
  const [liveJerkMm, setLiveJerkMm] = useState(0);
  const [peakJerkMm, setPeakJerkMm] = useState(0);
  const [activeDurationSec, setActiveDurationSec] = useState<HumanperfAttemptDurationSec>(
    DEFAULT_ATTEMPT_DURATION_SEC,
  );

  const samplesRef = useRef<AccelSample[]>([]);
  const prevSampleRef = useRef<AccelSample | null>(null);
  const recordingRef = useRef(false);
  const durationMsRef = useRef(DEFAULT_ATTEMPT_DURATION_SEC * 1000);
  const endAtRef = useRef(0);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
  }, []);

  const finishAttempt = useCallback(() => {
    recordingRef.current = false;
    clearTimers();
    setPhase('done');
    setSecsLeft(0);
    setProgress(0);
  }, [clearTimers]);

  useEffect(() => {
    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const now = Date.now();
      const sample: AccelSample = { x, y, z, t: now };

      if (recordingRef.current) {
        samplesRef.current.push(sample);
      }

      const prev = prevSampleRef.current;
      if (prev) {
        const jerk = computeJerkMm(prev, sample);
        setLiveJerkMm(jerk);
        if (recordingRef.current) {
          setPeakJerkMm((p) => Math.max(p, jerk));
        }
      }

      prevSampleRef.current = sample;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const startAttempt = useCallback(
    (durationSec: HumanperfAttemptDurationSec = DEFAULT_ATTEMPT_DURATION_SEC) => {
      const attemptMs = durationSec * 1000;
      durationMsRef.current = attemptMs;
      setActiveDurationSec(durationSec);

      clearTimers();
      samplesRef.current = [];
      prevSampleRef.current = null;
      recordingRef.current = true;
      endAtRef.current = Date.now() + attemptMs;
      setPhase('recording');
      setSecsLeft(durationSec);
      setProgress(1);
      setLiveJerkMm(0);
      setPeakJerkMm(0);

      tickTimerRef.current = setInterval(() => {
        const remaining = Math.max(0, endAtRef.current - Date.now());
        setSecsLeft(Math.ceil(remaining / 1000));
        setProgress(remaining / durationMsRef.current);
        if (remaining <= 0) {
          finishAttempt();
        }
      }, TICK_MS);

      finishTimerRef.current = setTimeout(finishAttempt, attemptMs);
    },
    [clearTimers, finishAttempt],
  );

  const stopAttempt = useCallback(() => {
    finishAttempt();
  }, [finishAttempt]);

  const resetAttempt = useCallback(
    (durationSec: HumanperfAttemptDurationSec = DEFAULT_ATTEMPT_DURATION_SEC) => {
      clearTimers();
      recordingRef.current = false;
      samplesRef.current = [];
      prevSampleRef.current = null;
      durationMsRef.current = durationSec * 1000;
      setActiveDurationSec(durationSec);
      setPhase('idle');
      setSecsLeft(durationSec);
      setProgress(1);
      setLiveJerkMm(0);
      setPeakJerkMm(0);
    },
    [clearTimers],
  );

  const getAttemptAggregate = useCallback(() => aggregateAttempt(samplesRef.current), []);

  return {
    phase,
    secsLeft,
    progress,
    liveJerkMm,
    peakJerkMm,
    activeDurationSec,
    samplesRef,
    startAttempt,
    stopAttempt,
    resetAttempt,
    getAttemptAggregate,
  };
}
