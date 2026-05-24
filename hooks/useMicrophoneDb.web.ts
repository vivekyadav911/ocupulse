import { useCallback, useRef, useState } from 'react';
import { aggregateSoundLevels, meteringToApproxSpl, SPL_MIN } from '../lib/calc/soundLevel';

export const MIC_HISTORY_POINTS = 72;
export const MIC_POLL_MS = 300;

export type MicStopResult = {
  peakDb: number;
  avgDb: number;
  sampleCount: number;
};

function rmsToDbfs(rms: number): number {
  if (rms <= 1e-8) return -160;
  return 20 * Math.log10(rms);
}

export function useMicrophoneDb() {
  const [liveDb, setLiveDb] = useState<number | null>(null);
  const [peakDb, setPeakDb] = useState<number | null>(null);
  const [capturePeakDb, setCapturePeakDb] = useState<number | null>(null);
  const [avgDb, setAvgDb] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>(() => Array(MIC_HISTORY_POINTS).fill(0));
  const [recording, setRecording] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionReady, setPermissionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sampleCount, setSampleCount] = useState(0);

  const samplesRef = useRef<number[]>([]);
  const captureSamplesRef = useRef<number[]>([]);
  const historyRef = useRef<number[]>(Array(MIC_HISTORY_POINTS).fill(0));
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeDataRef = useRef<Float32Array | null>(null);

  const pushMeterSample = useCallback((spl: number) => {
    samplesRef.current.push(spl);
    captureSamplesRef.current.push(spl);
    historyRef.current = [...historyRef.current.slice(1), spl];
    const { peakDb: sessionPeak, avgDb: nextAvg } = aggregateSoundLevels(samplesRef.current);
    const { peakDb: windowPeak } = aggregateSoundLevels(captureSamplesRef.current);
    setLiveDb(Math.round(spl));
    setPeakDb(sessionPeak);
    setCapturePeakDb(windowPeak);
    setAvgDb(nextAvg);
    setHistory([...historyRef.current]);
    setSampleCount(samplesRef.current.length);
  }, []);

  const teardown = useCallback(async () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    timeDataRef.current = null;
    if (audioCtxRef.current) {
      try {
        await audioCtxRef.current.close();
      } catch {
        /* noop */
      }
      audioCtxRef.current = null;
    }
    setRecording(false);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setSessionError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setSessionError('Microphone is not available in this browser — use a physical device.');
      setPermissionDenied(true);
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermissionDenied(false);
      setPermissionReady(true);
      return true;
    } catch {
      setPermissionDenied(true);
      setPermissionReady(false);
      return false;
    }
  }, []);

  const startMetering = useCallback(async (): Promise<boolean> => {
    if (pollRef.current) return true;
    setSessionError(null);

    const granted = permissionReady && !permissionDenied ? true : await requestPermission();
    if (!granted) return false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setSessionError('Microphone is not available in this browser.');
      return false;
    }

    try {
      await teardown();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.4;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      streamRef.current = stream;
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      timeDataRef.current = new Float32Array(analyser.fftSize);

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      setRecording(true);
      pollRef.current = setInterval(() => {
        const analyserNode = analyserRef.current;
        const buf = timeDataRef.current;
        if (!analyserNode || !buf) return;

        analyserNode.getFloatTimeDomainData(buf as Float32Array<ArrayBuffer>);
        let sumSq = 0;
        for (let i = 0; i < buf.length; i += 1) {
          sumSq += buf[i]! * buf[i]!;
        }
        const rms = Math.sqrt(sumSq / buf.length);
        const dbfs = rmsToDbfs(rms);
        if (dbfs <= -150) return;

        pushMeterSample(meteringToApproxSpl(dbfs));
      }, MIC_POLL_MS);

      return true;
    } catch (e) {
      await teardown();
      setSessionError(e instanceof Error ? e.message : 'Could not start microphone.');
      return false;
    }
  }, [permissionDenied, permissionReady, pushMeterSample, requestPermission, teardown]);

  const start = useCallback(async (): Promise<boolean> => {
    samplesRef.current = [];
    captureSamplesRef.current = [];
    historyRef.current = Array(MIC_HISTORY_POINTS).fill(0);
    setHistory([...historyRef.current]);
    setLiveDb(null);
    setPeakDb(null);
    setCapturePeakDb(null);
    setAvgDb(null);
    setSampleCount(0);
    return startMetering();
  }, [startMetering]);

  const stop = useCallback(async (): Promise<MicStopResult> => {
    await teardown();
    const { peakDb: finalPeak, avgDb: finalAvg } = aggregateSoundLevels(samplesRef.current);
    const count = samplesRef.current.length;
    return { peakDb: finalPeak || SPL_MIN, avgDb: finalAvg, sampleCount: count };
  }, [teardown]);

  const resetCapturePeak = useCallback(() => {
    captureSamplesRef.current = [];
    setCapturePeakDb(null);
  }, []);

  const resetSessionPeak = useCallback(() => {
    samplesRef.current = [];
    captureSamplesRef.current = [];
    historyRef.current = Array(MIC_HISTORY_POINTS).fill(0);
    setHistory([...historyRef.current]);
    setLiveDb(null);
    setPeakDb(null);
    setCapturePeakDb(null);
    setAvgDb(null);
    setSampleCount(0);
  }, []);

  return {
    requestPermission,
    startMetering,
    start,
    stop,
    resetCapturePeak,
    resetSessionPeak,
    liveDb,
    peakDb,
    capturePeakDb,
    avgDb,
    history,
    recording,
    permissionDenied,
    permissionReady,
    sessionError,
    sampleCount,
  };
}
