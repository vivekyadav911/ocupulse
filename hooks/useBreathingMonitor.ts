import { useCallback, useEffect, useRef, useState } from 'react';
import {
  breathsInWindow,
  countPeaksFromWaveform,
  createStreamingBreathDetector,
  pushWaveformSample,
  processAxisSample,
  type StreamingBreathDetectorState,
} from '../lib/breathing/breathCycleDetector';
import {
  BREATHING_SAMPLE_MS,
  BREATHING_WINDOW_MS,
  bpmFromPeakCount,
  WAVEFORM_DISPLAY_SEC,
  type WaveformPoint,
} from '../lib/breathing/breathingSignal';
import { useAccelerometer } from './useAccelerometer';

const UI_UPDATE_EVERY = 4; // ~6 Hz React updates from 25 Hz sensor

export type BreathingRecordingResult = {
  bpm: number;
  peakCount: number;
  peakTimes: number[];
  waveform: WaveformPoint[];
};

export function useBreathingMonitor() {
  const { x, y, z } = useAccelerometer(BREATHING_SAMPLE_MS);

  const [running, setRunning] = useState(false);
  const [liveBpm, setLiveBpm] = useState(0);
  const [signal, setSignal] = useState(0);
  const [waveform, setWaveform] = useState<WaveformPoint[]>([]);
  const [progress, setProgress] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [liveBreathCount, setLiveBreathCount] = useState(0);

  const runningRef = useRef(false);
  const startMsRef = useRef(0);
  const detectorRef = useRef<StreamingBreathDetectorState | null>(null);
  const displayBufferRef = useRef<WaveformPoint[]>([]);
  const recordingBufferRef = useRef<WaveformPoint[]>([]);
  const sampleIndexRef = useRef(0);

  const reset = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    setLiveBpm(0);
    setSignal(0);
    setWaveform([]);
    setProgress(0);
    setElapsedMs(0);
    setLiveBreathCount(0);
    startMsRef.current = 0;
    detectorRef.current = null;
    displayBufferRef.current = [];
    recordingBufferRef.current = [];
    sampleIndexRef.current = 0;
  }, []);

  const start = useCallback(() => {
    reset();
    runningRef.current = true;
    startMsRef.current = Date.now();
    detectorRef.current = createStreamingBreathDetector({ x, y, z });
    setRunning(true);
  }, [reset, x, y, z]);

  const finishRecording = useCallback((): BreathingRecordingResult => {
    const waveformData = recordingBufferRef.current;
    const analysis = countPeaksFromWaveform(waveformData);
    const peakCount = analysis.peakCount;
    const bpm = bpmFromPeakCount(peakCount, BREATHING_WINDOW_MS);
    return {
      bpm,
      peakCount,
      peakTimes: analysis.peakTimes,
      waveform: waveformData.slice(),
    };
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (!detectorRef.current) {
      detectorRef.current = createStreamingBreathDetector({ x, y, z });
    }

    const { state, signal: nextSignal } = processAxisSample(detectorRef.current, { x, y, z }, now, {
      freezeAxisBaseline: runningRef.current,
    });
    detectorRef.current = state;
    sampleIndexRef.current += 1;

    const sample: WaveformPoint = { t: now, z: nextSignal, x, y };

    const displayCutoff = now - WAVEFORM_DISPLAY_SEC * 1000;
    pushWaveformSample(displayBufferRef.current, sample, displayCutoff);

    if (runningRef.current) {
      recordingBufferRef.current.push(sample);
    }

    const rollingBreaths = breathsInWindow(state.breathTimes, now, BREATHING_WINDOW_MS);
    const nextBpm = bpmFromPeakCount(rollingBreaths, BREATHING_WINDOW_MS);

    const shouldUpdateUi = sampleIndexRef.current % UI_UPDATE_EVERY === 0;
    if (shouldUpdateUi) {
      setSignal(nextSignal);
      setWaveform(displayBufferRef.current.slice());
      setLiveBpm(nextBpm);
      setLiveBreathCount(rollingBreaths);
    }

    if (!runningRef.current) return;

    const elapsed = now - startMsRef.current;
    setElapsedMs(elapsed);
    setProgress(Math.min(1, elapsed / BREATHING_WINDOW_MS));

    if (elapsed >= BREATHING_WINDOW_MS) {
      runningRef.current = false;
      setRunning(false);
      setSignal(nextSignal);
      setWaveform(displayBufferRef.current.slice());
      setLiveBpm(nextBpm);
      setLiveBreathCount(rollingBreaths);
    }
  }, [x, y, z]);

  return {
    running,
    liveBpm,
    /** Combined X/Y/Z breathing signal (chart Y value). */
    signal,
    /** @deprecated alias */
    smoothedZ: signal,
    waveform,
    progress,
    elapsedMs,
    liveBreathCount,
    windowMs: BREATHING_WINDOW_MS,
    start,
    reset,
    finishRecording,
  };
}
