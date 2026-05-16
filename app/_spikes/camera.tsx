import { CameraView } from 'expo-camera';
import { Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { useCameraRecorder } from '../../hooks/useCameraRecorder';
import { useRecordingGate } from '../../hooks/useRecordingGate';
import { useThemedStyles } from '../../theme/themedStyles';

export default function CameraSpike() {
  const { recordingDisabled } = useRecordingGate();
  const cam = useCameraRecorder({ maxDurationSec: 10, frameSampleHz: 120 });
  const styles = useThemedStyles((t) => ({
    wrap: { flex: 1, padding: t.spacing.md },
    title: { fontSize: 18, fontWeight: '800', marginBottom: t.spacing.sm, color: t.colors.text },
    meta: { color: t.colors.muted, marginBottom: t.spacing.xs },
    preview: {
      height: 220,
      borderRadius: 12,
      marginVertical: t.spacing.md,
      overflow: 'hidden' as const,
    },
    err: { color: t.colors.danger, marginBottom: t.spacing.sm },
  }));

  const toggle = async () => {
    try {
      if (cam.isRecording) await cam.stop();
      else await cam.start();
    } catch {
      /* surfaced via cam.error */
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Camera recorder (120 Hz frame times)</Text>
      <Text style={styles.meta}>
        Permissions: camera {cam.cameraPermission?.granted ? '✓' : '—'} · mic{' '}
        {cam.microphonePermission?.granted ? '✓' : '—'}
      </Text>
      {cam.error ? <Text style={styles.err}>{cam.error}</Text> : null}
      <CameraView ref={cam.cameraRef} style={styles.preview} mode="video" facing="back" />
      <Text style={styles.meta}>Frame timestamps: {cam.frameTimes.length}</Text>
      <Text style={styles.meta} numberOfLines={1}>
        Last clip: {cam.lastClipUri ?? '—'}
      </Text>
      <Button
        title={cam.isRecording ? 'Stop (1s+ for 120 frames)' : 'Record'}
        onPress={toggle}
        disabled={recordingDisabled && !cam.isRecording}
      />
      <Button
        title="Request permissions"
        variant="secondary"
        onPress={() => void cam.requestPermissions()}
      />
    </View>
  );
}
