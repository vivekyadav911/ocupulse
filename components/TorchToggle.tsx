import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from './Button';
import { useThemedStyles } from '../theme/themedStyles';

/** Toggle device flashlight — keeps a live camera session so the torch stays on until you turn it off. */
export function TorchToggle() {
  const [torchOn, setTorchOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const styles = useThemedStyles((t) => ({
    hint: { color: t.colors.muted, fontSize: t.typography.caption, marginTop: t.spacing.xs },
    cameraHost: {
      position: 'absolute' as const,
      left: -120,
      top: 0,
      width: 80,
      height: 80,
      opacity: 0.02,
      overflow: 'hidden' as const,
    },
  }));

  const toggle = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setTorchOn((v) => !v);
  };

  const cameraReady = Boolean(permission?.granted);

  return (
    <View>
      {cameraReady ? (
        <View style={styles.cameraHost} pointerEvents="none">
          <CameraView style={{ flex: 1 }} facing="back" enableTorch={torchOn} />
        </View>
      ) : null}
      <Button
        title={torchOn ? 'Torch off' : 'Torch on'}
        variant="secondary"
        icon={torchOn ? 'flash' : 'flash-outline'}
        onPress={() => void toggle()}
      />
      <Text style={styles.hint}>
        {cameraReady
          ? torchOn
            ? 'Flashlight is on — tap Torch off when finished'
            : 'Tap to turn on the phone flashlight'
          : 'Camera permission is required for the torch'}
      </Text>
    </View>
  );
}
