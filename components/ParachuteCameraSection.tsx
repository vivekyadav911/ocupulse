import { CameraView } from 'expo-camera';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useCameraRecorder } from '../hooks/useCameraRecorder';
import { useRecordingGate } from '../hooks/useRecordingGate';
import { useThemedStyles } from '../theme/themedStyles';
import { Button } from './Button';

type ParachuteCameraSectionProps = {
  onRecorded: (uri: string) => void;
};

export function ParachuteCameraSection({ onRecorded }: ParachuteCameraSectionProps) {
  const { recordingDisabled } = useRecordingGate();
  const cam = useCameraRecorder({
    maxDurationSec: 120,
    frameSampleHz: 120,
    minRecordMs: 1500,
    recordAudio: false,
  });
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  const isSimulator = Platform.OS === 'ios' && Constants.platform?.ios?.simulator === true;

  const styles = useThemedStyles((t) => ({
    preview: {
      height: 220,
      borderRadius: t.radii.md,
      marginVertical: t.spacing.sm,
      overflow: 'hidden' as const,
      backgroundColor: t.colors.readoutBg,
    },
    placeholder: {
      height: 220,
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
    meta: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.sm,
    },
    row: { flexDirection: 'row' as const, gap: t.spacing.sm, marginBottom: t.spacing.sm },
  }));

  useEffect(() => {
    if (Platform.OS !== 'web') {
      void cam.requestPermissions();
    }
  }, [cam.requestPermissions]);

  const toggleRecording = async () => {
    try {
      if (cam.isRecording) {
        const uri = await cam.stop();
        if (uri) onRecorded(uri);
      } else {
        await cam.start();
      }
    } catch {
      /* cam.error surfaced below */
    }
  };

  const pickWebVideo = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const uri = URL.createObjectURL(file);
      cam.setClipFromUri(uri);
      onRecorded(uri);
    };
    input.click();
  };

  if (Platform.OS === 'web') {
    return (
      <View>
        <View style={styles.placeholder}>
          <Text style={styles.hint}>
            Live camera recording works on a phone or tablet. On web, upload a slow-motion clip
            instead.
          </Text>
          <Button title="Upload video file" variant="accent" onPress={pickWebVideo} />
        </View>
      </View>
    );
  }

  const hasPermission = cam.hasPermission;
  const canRecord = hasPermission && cam.isCameraReady && !recordingDisabled;

  return (
    <View>
      {isSimulator ? (
        <Text style={styles.meta}>
          iOS Simulator has limited camera support — test recording on a physical device.
        </Text>
      ) : null}
      {cam.error ? <Text style={styles.err}>{cam.error}</Text> : null}
      {!hasPermission ? (
        <View style={styles.placeholder}>
          <Text style={styles.hint}>Camera access is needed to record drops.</Text>
          <Text style={styles.meta}>
            Camera: {cam.cameraPermission?.granted ? 'granted' : 'denied'}
          </Text>
          <Button title="Enable camera" onPress={() => void cam.requestPermissions()} />
        </View>
      ) : (
        <>
          <CameraView
            ref={cam.cameraRef}
            style={styles.preview}
            mode="video"
            facing={facing}
            mute
            onCameraReady={cam.onCameraReady}
            onMountError={cam.onMountError}
          />
          {!cam.isCameraReady ? <Text style={styles.meta}>Starting camera preview…</Text> : null}
          <View style={styles.row}>
            <Button
              title={facing === 'back' ? 'Use front camera' : 'Use back camera'}
              variant="secondary"
              disabled={cam.isRecording}
              onPress={() => {
                if (cam.isRecording) return;
                setFacing((f) => (f === 'back' ? 'front' : 'back'));
              }}
            />
          </View>
        </>
      )}
      {hasPermission ? (
        <Button
          title={
            cam.isRecording
              ? 'Stop Recording (hold ≥1.5s)'
              : cam.isCameraReady
                ? 'Start Recording'
                : 'Waiting for camera…'
          }
          variant="accent"
          onPress={() => void toggleRecording()}
          disabled={(!cam.isRecording && !canRecord) || (!cam.isRecording && !cam.isCameraReady)}
          style={{ minHeight: 56 }}
        />
      ) : null}
    </View>
  );
}
