import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { Platform } from 'react-native';

export type HandfanCameraRef = ComponentRef<typeof CameraView>;

export function useHandfanCamera() {
  const cameraRef = useRef<HandfanCameraRef>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = permission?.granted === true;
  const permissionsLoading = permission === null && Platform.OS !== 'web';

  const requestPermissions = useCallback(async () => {
    if (Platform.OS === 'web') {
      setError('Camera preview is not available on web.');
      return false;
    }
    try {
      const result = await requestPermission();
      if (!result.granted) {
        setError(
          result.canAskAgain
            ? 'Camera permission is required to measure bend angle.'
            : 'Camera permission denied. Enable it in Settings.',
        );
        return false;
      }
      setError(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
  }, [requestPermission]);

  const onCameraReady = useCallback(() => {
    setIsCameraReady(true);
    setError(null);
  }, []);

  const onMountError = useCallback((evt: { message: string }) => {
    setIsCameraReady(false);
    setError(evt.message || 'Camera failed to start.');
  }, []);

  const resetCameraReady = useCallback(() => {
    setIsCameraReady(false);
  }, []);

  return {
    cameraRef,
    hasPermission,
    permissionsLoading,
    isCameraReady,
    error,
    requestPermissions,
    onCameraReady,
    onMountError,
    resetCameraReady,
  };
}
