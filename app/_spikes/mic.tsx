import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { useMicrophoneDb } from '../../hooks/useMicrophoneDb';
import { colors, spacing } from '../../theme/tokens';

export default function MicSpike() {
  const mic = useMicrophoneDb();
  useEffect(() => () => void mic.stop(), [mic]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.big}>{Math.round(mic.liveDb)} dB (approx SPL)</Text>
      <Text>
        Peak {Math.round(mic.peakDb)} · Avg {Math.round(mic.avgDb)}
      </Text>
      <Button title="Start" onPress={mic.start} />
      <Button title="Stop" variant="secondary" onPress={mic.stop} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md },
  big: { fontSize: 32, fontWeight: '800', color: colors.primary, marginBottom: spacing.md },
});
