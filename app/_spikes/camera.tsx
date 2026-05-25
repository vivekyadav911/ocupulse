import { CameraView } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { useCameraRecorder } from '../../hooks/useCameraRecorder';
import { useRecordingGate } from '../../hooks/useRecordingGate';
import { showAlert } from '../../lib/alert';
import { useThemedStyles } from '../../theme/themedStyles';

function permissionLabel(
  perm: { granted: boolean; canAskAgain: boolean } | null | undefined,
  loading: boolean,
): string {
  if (loading && perm == null) return '…';
  if (perm?.granted) return '✓';
  if (perm && !perm.canAskAgain) return 'blocked';
  return '—';
}

export default function CameraSpike() {
  const [torchOn, setTorchOn] = useState(false);
  const { recordingDisabled } = useRecordingGate();
  const cam = useCameraRecorder({ maxDurationSec: 10, frameSampleHz: 120, recordAudio: false });
  const styles = useThemedStyles((t) => ({
    wrap: { flex: 1, padding: t.spacing.md },
    title: { fontSize: 18, fontWeight: '800', marginBottom: t.spacing.sm, color: t.colors.text },
    meta: { color: t.colors.muted, marginBottom: t.spacing.xs, fontSize: 14 },
    preview: {
      height: 220,
      borderRadius: 12,
      marginVertical: t.spacing.md,
      overflow: 'hidden' as const,
      backgroundColor: t.colors.surfaceAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    previewPlaceholder: {
      color: t.colors.muted,
      textAlign: 'center' as const,
      paddingHorizontal: t.spacing.md,
      fontSize: 14,
      lineHeight: 20,
    },
    err: { color: t.colors.danger, marginBottom: t.spacing.sm, fontSize: 14 },
    settingsLink: {
      color: t.colors.accent,
      fontWeight: '700' as const,
      marginBottom: t.spacing.md,
      fontSize: 14,
    },
  }));

  useFocusEffect(
    useCallback(() => {
      void cam.refreshPermissions();
    }, [cam.refreshPermissions]),
  );

  const onRequestPermissions = async () => {
    const ok = await cam.requestPermissions();
    if (ok) {
      showAlert('Ready', 'Camera permission is enabled. Tap Record to test.');
      return;
    }
    const blocked = cam.cameraPermission?.canAskAgain === false;
    if (blocked) {
      showAlert(
        'Permission blocked',
        'Enable Camera for Ocupulse in system Settings, then return here.',
      );
    }
  };

  const openSettings = () => {
    void Linking.openSettings();
  };

  const toggle = async () => {
    try {
      if (cam.isRecording) await cam.stop();
      else await cam.start();
    } catch {
      /* surfaced via cam.error */
    }
  };

  const showPreview = Boolean(cam.cameraPermission?.granted);
  const needsSettings = cam.cameraPermission?.canAskAgain === false;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Camera recorder (120 Hz frame times)</Text>
      <Text style={styles.meta}>
        Permissions: camera {permissionLabel(cam.cameraPermission, cam.permissionsLoading)} · mic{' '}
        {permissionLabel(cam.microphonePermission, cam.permissionsLoading)}
      </Text>
      {cam.error ? <Text style={styles.err}>{cam.error}</Text> : null}
      {needsSettings ? (
        <Pressable onPress={openSettings} accessibilityRole="link">
          <Text style={styles.settingsLink}>Open system Settings → enable Camera</Text>
        </Pressable>
      ) : null}
      <View style={styles.preview}>
        {showPreview ? (
          <CameraView
            ref={cam.cameraRef}
            style={{ flex: 1, width: '100%' }}
            mode="video"
            facing="back"
            mute
            enableTorch={torchOn}
            onCameraReady={cam.onCameraReady}
            onMountError={cam.onMountError}
          />
        ) : (
          <Text style={styles.previewPlaceholder}>
            {cam.permissionsLoading
              ? 'Checking permissions…'
              : 'Allow camera access to see the live preview.\n\nTap “Request permissions” below.'}
          </Text>
        )}
      </View>
      {showPreview && !cam.isCameraReady ? (
        <Text style={styles.meta}>Starting camera preview…</Text>
      ) : null}
      <Text style={styles.meta}>Frame timestamps: {cam.frameTimes.length}</Text>
      <Text style={styles.meta} numberOfLines={1}>
        Last clip: {cam.lastClipUri ?? '—'}
      </Text>
      <Button
        title="Request permissions"
        variant="accent"
        onPress={() => void onRequestPermissions()}
        disabled={cam.permissionsLoading}
      />
      <Button
        title={torchOn ? 'Torch off' : 'Torch on'}
        variant="secondary"
        onPress={() => setTorchOn((v) => !v)}
        disabled={!showPreview}
      />
      <Button
        title={cam.isRecording ? 'Stop (1.5s+ for 120 frames)' : 'Record'}
        onPress={() => void toggle()}
        disabled={
          (recordingDisabled && !cam.isRecording) ||
          (!cam.isRecording && (!cam.isCameraReady || !cam.hasPermission))
        }
      />
      {Platform.OS === 'ios' ? (
        <Text style={[styles.meta, { marginTop: 8 }]}>
          If prompts never appear, delete and reinstall the app, or use a fresh Expo dev build after
          changing app.config.
        </Text>
      ) : null}
    </View>
  );
}
