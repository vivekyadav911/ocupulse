import { useCameraPermissions, useMicrophonePermissions, type CameraView } from 'expo-camera';
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Platform } from 'react-native';
import { createFrameSampler, type FrameSampler } from '../lib/camera/frameSampler';
import { normalizeClipUri } from '../lib/camera/normalizeClipUri';

export type UseCameraRecorderOptions = {
  /** Max clip length passed to `recordAsync`. */
  maxDurationSec?: number;
  /** Target frame-time sampling rate while recording (default 120 Hz). */
  frameSampleHz?: number;
  /** Minimum ms between start and stop to avoid native recorder errors. */
  minRecordMs?: number;
  /** When true, requests mic permission and records audio. Default false (video-only). */
  recordAudio?: boolean;
  /** Ms to wait after `onCameraReady` before allowing `recordAsync` (avoids native race). */
  readyDelayMs?: number;
};

export type CameraRecorderPermission = {
  granted: boolean;
  canAskAgain: boolean;
};

function failRecording(
  sampler: FrameSampler | null,
  stopPreviewTick: () => void,
  setError: (msg: string) => void,
  setIsRecording: (v: boolean) => void,
  isRecordingRef: MutableRefObject<boolean>,
  samplerRef: MutableRefObject<FrameSampler | null>,
  recordPromiseRef: MutableRefObject<Promise<{ uri: string } | undefined> | null>,
  message: string,
) {
  setError(message);
  sampler?.stop();
  samplerRef.current = null;
  stopPreviewTick();
  isRecordingRef.current = false;
  setIsRecording(false);
  recordPromiseRef.current = null;
}

export function useCameraRecorder(options: UseCameraRecorderOptions = {}) {
  const {
    maxDurationSec = 60,
    frameSampleHz = 120,
    minRecordMs = 1500,
    recordAudio = false,
    readyDelayMs = 500,
  } = options;

  const cameraRef = useRef<CameraView>(null);
  const samplerRef = useRef<FrameSampler | null>(null);
  const recordPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const previewTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false);
  const recordStartedAtRef = useRef(0);
  const cameraReadyAtRef = useRef(0);
  const unmountedRef = useRef(false);

  const [cameraPermission, requestCameraPermission, getCameraPermissions] = useCameraPermissions();
  const [micPermission, requestMicPermission, getMicrophonePermissions] =
    useMicrophonePermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [lastClipUri, setLastClipUri] = useState<string | null>(null);
  const [frameTimes, setFrameTimes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refreshPermissions = useCallback(async () => {
    await Promise.all([getCameraPermissions(), getMicrophonePermissions()]);
  }, [getCameraPermissions, getMicrophonePermissions]);

  const stopPreviewTick = useCallback(() => {
    if (previewTickRef.current) clearInterval(previewTickRef.current);
    previewTickRef.current = null;
  }, []);

  const startPreviewTick = useCallback(() => {
    stopPreviewTick();
    previewTickRef.current = setInterval(() => {
      const sampler = samplerRef.current;
      if (sampler) setFrameTimes([...sampler.samples]);
    }, 100);
  }, [stopPreviewTick]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setError(null);
    const cam = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!cam.granted) {
      setError(
        cam.canAskAgain
          ? 'Camera access is required. Allow it when prompted.'
          : 'Camera was denied. Open Settings → Ocupulse → enable Camera.',
      );
      return false;
    }
    if (recordAudio) {
      const mic = micPermission?.granted ? micPermission : await requestMicPermission();
      if (!mic.granted) {
        setError(
          mic.canAskAgain
            ? 'Microphone access is required for video with sound. Allow it when prompted.'
            : 'Microphone was denied. Open Settings → Ocupulse → enable Microphone.',
        );
        return false;
      }
    }
    return true;
  }, [cameraPermission, micPermission, recordAudio, requestCameraPermission, requestMicPermission]);

  const onCameraReady = useCallback(() => {
    cameraReadyAtRef.current = Date.now();
    setIsCameraReady(true);
  }, []);

  const resetCameraReady = useCallback(() => {
    cameraReadyAtRef.current = 0;
    setIsCameraReady(false);
  }, []);

  const onMountError = useCallback(
    ({ message }: { message: string }) => {
      setError(message || 'Camera failed to start.');
      resetCameraReady();
    },
    [resetCameraReady],
  );

  const start = useCallback(async () => {
    setError(null);

    if (Platform.OS === 'web') {
      const msg = 'Live camera recording is not supported in the browser.';
      setError(msg);
      throw new Error(msg);
    }

    if (!isCameraReady) {
      const msg = 'Wait for the camera preview to load before recording.';
      setError(msg);
      throw new Error(msg);
    }

    const readyForMs = Date.now() - cameraReadyAtRef.current;
    if (readyForMs < readyDelayMs) {
      await new Promise((resolve) => setTimeout(resolve, readyDelayMs - readyForMs));
    }

    const granted = await requestPermissions();
    if (!granted) {
      throw new Error(
        recordAudio
          ? 'Camera and microphone permissions are required to record.'
          : 'Camera permission is required to record.',
      );
    }

    const camera = cameraRef.current;
    if (!camera) {
      const msg = 'Camera is not ready yet. Try again in a moment.';
      setError(msg);
      throw new Error(msg);
    }

    if (isRecordingRef.current) return;

    const sampler = createFrameSampler(frameSampleHz);
    samplerRef.current = sampler;
    sampler.start();
    setFrameTimes([]);
    isRecordingRef.current = true;
    setIsRecording(true);
    recordStartedAtRef.current = Date.now();
    startPreviewTick();

    const recordPromise = camera.recordAsync({ maxDuration: maxDurationSec });
    recordPromiseRef.current = recordPromise;

    void recordPromise.catch((e: unknown) => {
      if (unmountedRef.current || !isRecordingRef.current) return;
      const msg = e instanceof Error ? e.message : 'An error occurred while recording a video';
      failRecording(
        samplerRef.current,
        stopPreviewTick,
        setError,
        setIsRecording,
        isRecordingRef,
        samplerRef,
        recordPromiseRef,
        msg,
      );
    });
  }, [
    frameSampleHz,
    isCameraReady,
    maxDurationSec,
    readyDelayMs,
    recordAudio,
    requestPermissions,
    startPreviewTick,
    stopPreviewTick,
  ]);

  const stop = useCallback(async (): Promise<string | null> => {
    const camera = cameraRef.current;
    const sampler = samplerRef.current;
    if (!camera || !sampler || !isRecordingRef.current) return null;

    const elapsed = Date.now() - recordStartedAtRef.current;
    if (elapsed < minRecordMs) {
      await new Promise((resolve) => setTimeout(resolve, minRecordMs - elapsed));
    }

    const pending = recordPromiseRef.current;
    isRecordingRef.current = false;
    setIsRecording(false);

    try {
      camera.stopRecording();
      const times = sampler.stop();
      samplerRef.current = null;
      stopPreviewTick();
      setFrameTimes(times);

      const result = await pending;
      recordPromiseRef.current = null;
      if (result?.uri) {
        const uri = normalizeClipUri(result.uri);
        setLastClipUri(uri);
        setError(null);
        return uri;
      }
      setError('Recording finished but no video file was saved.');
      return null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Recording failed';
      failRecording(
        sampler,
        stopPreviewTick,
        setError,
        setIsRecording,
        isRecordingRef,
        samplerRef,
        recordPromiseRef,
        msg,
      );
      return null;
    }
  }, [minRecordMs, stopPreviewTick]);

  const setClipFromUri = useCallback((uri: string) => {
    setLastClipUri(normalizeClipUri(uri));
    setError(null);
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    const camera = cameraRef.current;
    return () => {
      unmountedRef.current = true;
      samplerRef.current?.stop();
      samplerRef.current = null;
      stopPreviewTick();
      if (isRecordingRef.current) {
        isRecordingRef.current = false;
        try {
          camera?.stopRecording();
        } catch {
          /* unmount cleanup */
        }
        void recordPromiseRef.current?.catch(() => {
          /* absorb rejection from interrupted recording */
        });
        recordPromiseRef.current = null;
      }
    };
  }, [stopPreviewTick]);

  const hasPermission = recordAudio
    ? Boolean(cameraPermission?.granted && micPermission?.granted)
    : Boolean(cameraPermission?.granted);

  return {
    cameraRef,
    start,
    stop,
    lastClipUri,
    frameTimes,
    isRecording,
    isCameraReady,
    onCameraReady,
    onMountError,
    resetCameraReady,
    setClipFromUri,
    error,
    requestPermissions,
    refreshPermissions,
    hasPermission,
    permissionsLoading: cameraPermission == null || micPermission == null,
    recordAudio,
    cameraPermission: toPermission(cameraPermission),
    microphonePermission: toPermission(micPermission),
  };
}

function toPermission(
  response: { granted: boolean; canAskAgain: boolean } | null | undefined,
): CameraRecorderPermission | null {
  if (!response) return null;
  return { granted: response.granted, canAskAgain: response.canAskAgain };
}
