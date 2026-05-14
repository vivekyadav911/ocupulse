import { Audio } from 'expo-av';
import { useCallback, useRef, useState } from 'react';

function meteringToApproxSpl(dbfs: number): number {
  return dbfs + 90;
}

export function useMicrophoneDb() {
  const [liveDb, setLiveDb] = useState(35);
  const [peakDb, setPeakDb] = useState(35);
  const [avgDb, setAvgDb] = useState(35);
  const recording = useRef<Audio.Recording | null>(null);
  const sum = useRef(0);
  const n = useRef(0);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    recording.current = rec;
    setPeakDb(35);
    sum.current = 0;
    n.current = 0;
    poll.current = setInterval(async () => {
      const st = await rec.getStatusAsync();
      if (!st.isRecording) return;
      const m = 'metering' in st && typeof st.metering === 'number' ? st.metering : -60;
      const spl = meteringToApproxSpl(m);
      setLiveDb(Math.round(spl));
      setPeakDb((p) => Math.max(p, spl));
      sum.current += spl;
      n.current += 1;
      setAvgDb(Math.round(sum.current / n.current));
    }, 150);
  }, []);

  const stop = useCallback(async () => {
    if (poll.current) clearInterval(poll.current);
    poll.current = null;
    if (recording.current) {
      try {
        await recording.current.stopAndUnloadAsync();
      } catch {
        /* noop */
      }
      recording.current = null;
    }
  }, []);

  return { start, stop, liveDb, peakDb, avgDb };
}
