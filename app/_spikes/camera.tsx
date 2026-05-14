import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { useCameraRecorder } from '../../hooks/useCameraRecorder';
import { colors, spacing } from '../../theme/tokens';

export default function CameraSpike() {
  const cam = useCameraRecorder();
  return (
    <View style={styles.wrap}>
      <Text style={styles.t}>
        Camera recording spike (stub — hook real CameraView in dev client)
      </Text>
      <Text>Frames logged: {cam.frameTimes.length}</Text>
      <Button
        title={cam.isRecording ? 'Stop' : 'Record'}
        onPress={cam.isRecording ? cam.stop : cam.start}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md },
  t: { marginBottom: spacing.md, color: colors.text },
});
