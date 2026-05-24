import { useCameraPermissions, useMicrophonePermissions, type CameraView } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createFrameSampler } from '../lib/camera/frameSampler';
import { normalizeClipUri } from '../lib/camera/normalizeClipUri';

export type UseCameraRecorderOptions = {
  /** Max clip length passed to `recordAsync`. */
  maxDurationSec?: number;
  /** Target frame-time sampling rate while recording (default 120 Hz). */
  frameSampleHz?: number;
};

export type CameraRecorderPermission = {
  granted: boolean;
  canAskAgain: boolean;
};

export function useCameraRecorder(options: UseCameraRecorderOptions = {}) {
  const { maxDurationSec = 60, frameSampleHz = 120 } = options;

  const cameraRef = useRef<CameraView>(null);
  const samplerRef = useRef<ReturnType<typeof createFrameSampler> | null>(null);
  const recordPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const previewTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false);

  const [cameraPermission, requestCameraPermission, getCameraPermissions] = useCameraPermissions();
  const [micPermission, requestMicPermission, getMicrophonePermissions] =
    useMicrophonePermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [lastClipUri, setLastClipUri] = useState<string | null>(null);
  const [frameTimes, setFrameTimes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refreshPermissions = useCallback(async () => {
    await Promise.all([getCameraPermissions(), getMicrophonePermissions()]);
  }, [getCameraPermissions, getMicrophonePermissions]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setError(null);
    const cam = await requestCameraPermission();
    if (!cam.granted) {
      setError(
        cam.canAskAgain
          ? 'Camera access is required. Allow it when iOS prompts you.'
          : 'Camera was denied. Open Settings → Ocupulse → enable Camera.',
      );
      return false;
    }
    const mic = await requestMicPermission();
    if (!mic.granted) {
      setError(
        mic.canAskAgain
          ? 'Microphone access is required for video with sound. Allow it when prompted.'
          : 'Microphone was denied. Open Settings → Ocupulse → enable Microphone.',
      );
      return false;
    }
    return true;
  }, [requestCameraPermission, requestMicPermission]);

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

  const start = useCallback(async () => {
    setError(null);
    const granted = await requestPermissions();
    if (!granted) {
      const msg = 'Camera and microphone permissions are required to record.';
      setError(msg);
      throw new Error(msg);
    }

    const camera = cameraRef.current;
    if (!camera) {
      const msg = 'Attach <CameraView ref={cameraRef} mode="video" /> before calling start().';
      setError(msg);
      throw new Error(msg);
    }

    const sampler = createFrameSampler(frameSampleHz);
    samplerRef.current = sampler;
    sampler.start();
    setFrameTimes([]);
    isRecordingRef.current = true;
    setIsRecording(true);
    startPreviewTick();

    recordPromiseRef.current = camera.recordAsync({ maxDuration: maxDurationSec });
  }, [frameSampleHz, maxDurationSec, requestPermissions, startPreviewTick]);

  const stop = useCallback(async () => {
    const camera = cameraRef.current;
    const sampler = samplerRef.current;
    if (!camera || !sampler || !isRecordingRef.current) return;

    try {
      camera.stopRecording();
      const times = sampler.stop();
      samplerRef.current = null;
      stopPreviewTick();
      setFrameTimes(times);
      isRecordingRef.current = false;
      setIsRecording(false);

      const result = await recordPromiseRef.current;
      recordPromiseRef.current = null;
      if (result?.uri) {
        setLastClipUri(normalizeClipUri(result.uri));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Recording failed';
      setError(msg);
      sampler.stop();
      samplerRef.current = null;
      stopPreviewTick();
      isRecordingRef.current = false;
      setIsRecording(false);
      recordPromiseRef.current = null;
      throw e;
    }
  }, [stopPreviewTick]);

  useEffect(() => {
    const camera = cameraRef.current;
    return () => {
      samplerRef.current?.stop();
      samplerRef.current = null;
      stopPreviewTick();
      if (isRecordingRef.current) {
        camera?.stopRecording();
      }
      if (__DEV__) {
        console.count('ocupulse/camera-recorder unmount');
      }
    };
  }, [stopPreviewTick]);

  useEffect(() => {
    if (__DEV__) {
      console.count('ocupulse/camera-recorder mount');
    }
  }, []);

  return {
    cameraRef,
    start,
    stop,
    lastClipUri,
    frameTimes,
    isRecording,
    error,
    requestPermissions,
    refreshPermissions,
    hasPermission: Boolean(cameraPermission?.granted && micPermission?.granted),
    permissionsLoading: cameraPermission == null || micPermission == null,
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
