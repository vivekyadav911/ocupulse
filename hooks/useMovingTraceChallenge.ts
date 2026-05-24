import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildIdealFingerTrace,
  buildReplayShapePath,
  buildWaveSnapshotPaths,
  DEFAULT_TRACE_DURATION_MS,
  randomMovingWaveConfig,
  traceAccuracyPct,
  traceAvgDelayMs,
  TRACE_ACCURACY_THRESHOLD_PX,
  type MovingWaveConfig,
} from '../lib/calc/reactionStats';
import type { Phase3Result, TracePoint } from '../lib/reaction/sessionState';

export type MovingTracePhase = 'idle' | 'running' | 'done';

export type UseMovingTraceChallengeOptions = {
  width: number;
  height: number;
  durationMs?: number;
};

export function useMovingTraceChallenge({
  width,
  height,
  durationMs = DEFAULT_TRACE_DURATION_MS,
}: UseMovingTraceChallengeOptions) {
  const [phase, setPhase] = useState<MovingTracePhase>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [tracePath, setTracePath] = useState<TracePoint[]>([]);
  const [config, setConfig] = useState<MovingWaveConfig>(() =>
    randomMovingWaveConfig(width, height),
  );
  const [canvasSize, setCanvasSize] = useState({ width, height });

  const startTsRef = useRef(0);
  const tracePathRef = useRef<TracePoint[]>([]);
  const configRef = useRef(config);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingResultRef = useRef<Phase3Result | null>(null);

  configRef.current = config;

  useEffect(() => {
    setCanvasSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, [width, height]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const newRandomConfig = useCallback((w: number, h: number) => randomMovingWaveConfig(w, h), []);

  const finishChallenge = useCallback(() => {
    clearTimer();
    const cfg = configRef.current;
    const startTs = startTsRef.current;
    const path = tracePathRef.current;
    const shapeSamples = buildReplayShapePath(cfg, durationMs);
    const shapeSamplesWithTs = shapeSamples.map((s) => ({
      ...s,
      t: startTs + s.t,
    }));

    const accuracyPct = traceAccuracyPct(path, TRACE_ACCURACY_THRESHOLD_PX, cfg, startTs);
    const avgDelayMs = traceAvgDelayMs(path, shapeSamplesWithTs);
    const idealTrace = buildIdealFingerTrace(cfg, durationMs).map((s) => ({
      ...s,
      t: startTs + s.t,
    }));
    const waveSnapshots = buildWaveSnapshotPaths(cfg, durationMs);

    const result: Phase3Result = {
      tracePath: path,
      accuracyPct,
      avgDelayMs,
      idealTrace,
      waveSnapshots,
      waveConfig: { ...cfg },
    };

    pendingResultRef.current = result;
    setPhase('done');
  }, [clearTimer, durationMs]);

  const start = useCallback(() => {
    clearTimer();
    const w = canvasSize.width || width;
    const h = canvasSize.height || height;
    const nextConfig = newRandomConfig(w, h);
    setConfig(nextConfig);
    configRef.current = nextConfig;
    setTracePath([]);
    tracePathRef.current = [];
    setElapsedMs(0);
    pendingResultRef.current = null;
    startTsRef.current = Date.now();
    setPhase('running');

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTsRef.current;
      setElapsedMs(elapsed);
      if (elapsed >= durationMs) {
        clearTimer();
        setElapsedMs(durationMs);
      }
    }, 50);
  }, [canvasSize.height, canvasSize.width, clearTimer, durationMs, newRandomConfig, width]);

  useEffect(() => {
    if (phase === 'running' && elapsedMs >= durationMs) {
      finishChallenge();
    }
  }, [phase, elapsedMs, durationMs, finishChallenge]);

  const addTouchPoint = useCallback(
    (x: number, y: number) => {
      if (phase !== 'running') return;
      const point = { x, y, t: Date.now() };
      tracePathRef.current = [...tracePathRef.current, point];
      setTracePath(tracePathRef.current);
    },
    [phase],
  );

  const reset = useCallback(() => {
    clearTimer();
    const w = canvasSize.width || width;
    const h = canvasSize.height || height;
    const nextConfig = newRandomConfig(w, h);
    setConfig(nextConfig);
    configRef.current = nextConfig;
    setPhase('idle');
    setElapsedMs(0);
    setTracePath([]);
    tracePathRef.current = [];
    pendingResultRef.current = null;
  }, [canvasSize.height, canvasSize.width, clearTimer, newRandomConfig, width]);

  const setCanvasLayout = useCallback(
    (w: number, h: number) => {
      if (w <= 0 || h <= 0) return;
      setCanvasSize({ width: w, height: h });
      if (phase === 'idle') {
        const nextConfig = newRandomConfig(w, h);
        setConfig(nextConfig);
        configRef.current = nextConfig;
      }
    },
    [newRandomConfig, phase],
  );

  const consumeResult = useCallback((): Phase3Result | null => {
    const result = pendingResultRef.current;
    pendingResultRef.current = null;
    return result;
  }, []);

  return {
    phase,
    elapsedMs,
    tracePath,
    config,
    canvasSize,
    start,
    reset,
    addTouchPoint,
    setCanvasLayout,
    consumeResult,
    durationMs,
  };
}
