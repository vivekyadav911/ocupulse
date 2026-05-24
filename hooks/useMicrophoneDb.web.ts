import { useCallback, useRef, useState } from 'react';
import {
  createSplAccumulator,
  dbfsToApproxSpl,
  isValidMeteringDbfs,
  pushSplSample,
  SPL_MIN,
  splAccumulatorAverages,
  type SplAccumulator,
} from '../lib/sound/metering';

const POLL_MS = 100;

function rmsToDbfs(rms: number): number {
  if (rms <= 1e-8) return -160;
  return 20 * Math.log10(rms);
}

export function useMicrophoneDb() {
  const [liveDb, setLiveDb] = useState(SPL_MIN);
  const [peakDb, setPeakDb] = useState(SPL_MIN);
  const [avgDb, setAvgDb] = useState(SPL_MIN);
  const accRef = useRef<SplAccumulator>(createSplAccumulator());
  const lastLiveRef = useRef(SPL_MIN);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeDataRef = useRef<Float32Array | null>(null);

  const publishLevels = useCallback((acc: SplAccumulator, live: number) => {
    const { peakDb: peak, avgDb: avg } = splAccumulatorAverages(acc);
    lastLiveRef.current = live;
    setLiveDb(Math.round(live));
    setPeakDb(Math.round(peak));
    setAvgDb(Math.round(avg));
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
  }, []);

  const start = useCallback(async () => {
    await teardown();
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone is not available in this browser.');
    }

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
    accRef.current = createSplAccumulator();
    publishLevels(accRef.current, SPL_MIN);

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    pollRef.current = setInterval(() => {
      const analyserNode = analyserRef.current;
      const buf = timeDataRef.current;
      if (!analyserNode || !buf) return;

      analyserNode.getFloatTimeDomainData(buf);
      let sumSq = 0;
      for (let i = 0; i < buf.length; i += 1) {
        sumSq += buf[i] * buf[i];
      }
      const rms = Math.sqrt(sumSq / buf.length);
      const dbfs = rmsToDbfs(rms);
      if (!isValidMeteringDbfs(dbfs)) return;

      const spl = dbfsToApproxSpl(dbfs);
      accRef.current = pushSplSample(accRef.current, spl);
      publishLevels(accRef.current, spl);
    }, POLL_MS);
  }, [publishLevels, teardown]);

  const stop = useCallback(async () => {
    await teardown();
    const levels = splAccumulatorAverages(accRef.current);
    setLiveDb(Math.round(lastLiveRef.current));
    setPeakDb(Math.round(levels.peakDb));
    setAvgDb(Math.round(levels.avgDb));
    return levels;
  }, [teardown]);

  return { start, stop, liveDb, peakDb, avgDb };
}
