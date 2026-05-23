import { Audio, InterruptionModeIOS } from 'expo-av';
import { useCallback, useRef, useState } from 'react';
import { aggregateSoundLevels, meteringToApproxSpl } from '../lib/calc/soundLevel';

export const MIC_HISTORY_POINTS = 72;
export const MIC_POLL_MS = 150;

const METERING_RECORD_OPTIONS: Audio.RecordingOptions = {
  ...Audio.RecordingOptionsPresets.LOW_QUALITY,
  isMeteringEnabled: true,
};

export type MicStopResult = {
  peakDb: number;
  avgDb: number;
  sampleCount: number;
};

async function configureRecordingAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

async function releaseRecordingAudioMode(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    /* noop */
  }
}

export function useMicrophoneDb() {
  const [liveDb, setLiveDb] = useState<number | null>(null);
  const [peakDb, setPeakDb] = useState<number | null>(null);
  const [avgDb, setAvgDb] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>(() => Array(MIC_HISTORY_POINTS).fill(0));
  const [recording, setRecording] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sampleCount, setSampleCount] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const samplesRef = useRef<number[]>([]);
  const historyRef = useRef<number[]>(Array(MIC_HISTORY_POINTS).fill(0));
  const startingRef = useRef(false);

  const pushMeterSample = useCallback((spl: number) => {
    samplesRef.current.push(spl);
    historyRef.current = [...historyRef.current.slice(1), spl];
    const { peakDb: nextPeak, avgDb: nextAvg } = aggregateSoundLevels(samplesRef.current);
    setLiveDb(Math.round(spl));
    setPeakDb(nextPeak);
    setAvgDb(nextAvg);
    setHistory([...historyRef.current]);
    setSampleCount(samplesRef.current.length);
  }, []);

  const onRecordingStatusUpdate = useCallback(
    (status: Audio.RecordingStatus) => {
      if (!status.isRecording) return;
      const m = 'metering' in status && typeof status.metering === 'number' ? status.metering : -60;
      pushMeterSample(meteringToApproxSpl(m));
    },
    [pushMeterSample],
  );

  const unloadRecording = useCallback(async () => {
    const active = recordingRef.current;
    recordingRef.current = null;
    if (!active) return;
    try {
      await active.stopAndUnloadAsync();
    } catch {
      /* noop */
    }
    await releaseRecordingAudioMode();
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (startingRef.current) return false;
    startingRef.current = true;
    setSessionError(null);

    try {
      await unloadRecording();

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setRecording(false);
        return false;
      }
      setPermissionDenied(false);

      await configureRecordingAudioMode();

      const { recording } = await Audio.Recording.createAsync(
        METERING_RECORD_OPTIONS,
        onRecordingStatusUpdate,
        MIC_POLL_MS,
      );

      recordingRef.current = recording;
      samplesRef.current = [];
      historyRef.current = Array(MIC_HISTORY_POINTS).fill(0);
      setHistory([...historyRef.current]);
      setLiveDb(null);
      setPeakDb(null);
      setAvgDb(null);
      setSampleCount(0);
      setRecording(true);
      return true;
    } catch (e) {
      recordingRef.current = null;
      setRecording(false);
      await releaseRecordingAudioMode();
      const msg = e instanceof Error ? e.message : 'Could not start microphone session.';
      setSessionError(
        msg.includes('Session activation failed')
          ? 'Microphone session busy — close other audio apps, leave and re-open this screen, or use a physical device (not Simulator).'
          : msg,
      );
      return false;
    } finally {
      startingRef.current = false;
    }
  }, [onRecordingStatusUpdate, unloadRecording]);

  const stop = useCallback(async (): Promise<MicStopResult> => {
    setRecording(false);
    await unloadRecording();
    const { peakDb: finalPeak, avgDb: finalAvg } = aggregateSoundLevels(samplesRef.current);
    const count = samplesRef.current.length;
    if (count > 0) {
      setPeakDb(finalPeak);
      setAvgDb(finalAvg);
      setLiveDb(Math.round(samplesRef.current[count - 1]!));
    }
    setSampleCount(count);
    return { peakDb: finalPeak, avgDb: finalAvg, sampleCount: count };
  }, [unloadRecording]);

  return {
    start,
    stop,
    liveDb,
    peakDb,
    avgDb,
    history,
    recording,
    permissionDenied,
    sessionError,
    sampleCount,
  };
}
