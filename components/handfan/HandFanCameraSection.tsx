import { CameraView } from 'expo-camera';
import Constants from 'expo-constants';
import { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import { useHandfanCamera } from '../../hooks/useHandfanCamera';
import { useThemedStyles } from '../../theme/themedStyles';
import { Button } from '../Button';

type HandFanCameraSectionProps = {
  children?: React.ReactNode;
};

export function HandFanCameraSection({ children }: HandFanCameraSectionProps) {
  const {
    cameraRef,
    hasPermission,
    permissionsLoading,
    error,
    requestPermissions,
    onCameraReady,
    onMountError,
  } = useHandfanCamera();
  const isSimulator = Platform.OS === 'ios' && Constants.platform?.ios?.simulator === true;

  const styles = useThemedStyles((t) => ({
    previewWrap: {
      height: 280,
      borderRadius: t.radii.md,
      marginVertical: t.spacing.sm,
      overflow: 'hidden' as const,
      backgroundColor: t.colors.readoutBg,
      position: 'relative' as const,
    },
    preview: {
      flex: 1,
    },
    placeholder: {
      height: 280,
      borderRadius: t.radii.md,
      marginVertical: t.spacing.sm,
      backgroundColor: t.colors.readoutBg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      padding: t.spacing.md,
    },
    hint: {
      color: t.colors.muted,
      textAlign: 'center' as const,
      marginBottom: t.spacing.sm,
      lineHeight: 20,
    },
    err: { color: t.colors.danger, marginBottom: t.spacing.sm, lineHeight: 20 },
  }));

  useEffect(() => {
    if (Platform.OS !== 'web') {
      void requestPermissions();
    }
  }, [requestPermissions]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.hint}>
          Camera preview is not available on web. Use a device to measure bend angle.
        </Text>
      </View>
    );
  }

  if (permissionsLoading) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.hint}>Checking camera permission…</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.err}>{error ?? 'Camera permission required.'}</Text>
        <Button title="Allow camera" onPress={() => void requestPermissions()} />
      </View>
    );
  }

  return (
    <View>
      {isSimulator ? (
        <Text style={styles.hint}>
          iOS Simulator has no camera — use a physical device for live preview.
        </Text>
      ) : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <View style={styles.previewWrap}>
        <CameraView
          ref={cameraRef}
          style={styles.preview}
          facing="back"
          onCameraReady={onCameraReady}
          onMountError={onMountError}
        />
        {children}
      </View>
    </View>
  );
}
