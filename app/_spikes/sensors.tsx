import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAccelerometer } from '../../hooks/useAccelerometer';
import { useGyroscope } from '../../hooks/useGyroscope';
import { colors, spacing } from '../../theme/tokens';

const w = Dimensions.get('window').width - spacing.md * 2;

export default function SensorsSpike() {
  const { magnitude } = useAccelerometer();
  const g = useGyroscope();
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.t}>Accel magnitude: {magnitude.toFixed(3)}</Text>
      <Text style={styles.t}>Gyro magnitude: {g.magnitude.toFixed(3)}</Text>
      <LineChart
        data={{
          labels: ['', '', '', '', '', ''],
          datasets: [{ data: [0, magnitude, g.magnitude, 1, 2, 3] }],
        }}
        width={w}
        height={200}
        chartConfig={{
          color: () => colors.primary,
          labelColor: () => colors.muted,
          backgroundColor: colors.surface,
          propsForDots: { r: '0' },
        }}
        style={{ marginTop: spacing.md, borderRadius: 12 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md },
  t: { fontSize: 16, marginBottom: spacing.sm, color: colors.text },
});
