import { useCallback, useRef, useState } from 'react';

/** Stub recorder — stores frame timestamps for slow‑mo analysis demos; swap in expo-camera in dev client. */
export function useCameraRecorder() {
  const [isRecording, setRecording] = useState(false);
  const [lastClipUri] = useState<string | null>(null);
  const frameTimesRef = useRef<number[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    frameTimesRef.current = [];
    const t0 = Date.now();
    setRecording(true);
    tickRef.current = setInterval(() => {
      frameTimesRef.current.push(Date.now() - t0);
    }, 1000 / 60);
  }, []);

  const stop = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    setRecording(false);
  }, []);

  return {
    start,
    stop,
    lastClipUri,
    frameTimes: frameTimesRef.current,
    isRecording,
  };
}
