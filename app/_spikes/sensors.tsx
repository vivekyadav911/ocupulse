import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAccelerometer } from '../../hooks/useAccelerometer';
import { useGyroscope } from '../../hooks/useGyroscope';
import { colors, spacing } from '../../theme/tokens';

const CHART_WIDTH = Dimensions.get('window').width - spacing.md * 2;
const CHART_POINTS = 60;
/** Chart repaint target ≥30 fps (US12). */
const CHART_INTERVAL_MS = 1000 / 30;

const chartConfig = {
  color: () => colors.primary,
  labelColor: () => colors.muted,
  backgroundColor: colors.surface,
  propsForDots: { r: '0' },
};

export default function SensorsSpike() {
  const { x, y, z, magnitude: accelMag } = useAccelerometer();
  const gyro = useGyroscope();

  const magHistory = useRef<number[]>(Array(CHART_POINTS).fill(0));
  const [chartSeries, setChartSeries] = useState<number[]>(() => [...magHistory.current]);

  useEffect(() => {
    magHistory.current = [...magHistory.current.slice(1), accelMag];
  }, [accelMag]);

  useEffect(() => {
    const timer = setInterval(() => {
      setChartSeries([...magHistory.current]);
    }, CHART_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Sensor spike (60 Hz)</Text>

      <Text style={styles.label}>Accelerometer</Text>
      <Text style={styles.vec}>
        x {x.toFixed(2)} · y {y.toFixed(2)} · z {z.toFixed(2)} · |a| {accelMag.toFixed(3)}
      </Text>

      <Text style={[styles.label, { marginTop: spacing.sm }]}>Gyroscope</Text>
      <Text style={styles.vec}>
        x {gyro.x.toFixed(2)} · y {gyro.y.toFixed(2)} · z {gyro.z.toFixed(2)} · |ω|{' '}
        {gyro.magnitude.toFixed(3)}
      </Text>

      <Text style={styles.chartTitle}>Live accel magnitude (≥30 fps chart)</Text>
      <LineChart
        data={{
          labels: Array(6).fill(''),
          datasets: [{ data: chartSeries.length >= 2 ? chartSeries : [0, accelMag, 0.1, 0.2] }],
        }}
        width={CHART_WIDTH}
        height={220}
        chartConfig={chartConfig}
        style={styles.chart}
        withInnerLines={false}
        withOuterLines={false}
      />

      {__DEV__ ? (
        <Text style={styles.dev}>
          Dev: leaving this screen should balance ocupulse/accelerometer-listener and
          ocupulse/gyroscope-listener mount/unmount counts.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt },
  h1: { fontSize: 20, fontWeight: '800', marginBottom: spacing.md, color: colors.primary },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  vec: { fontSize: 14, color: colors.muted, marginBottom: spacing.xs },
  chartTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: '600',
    color: colors.text,
  },
  chart: { borderRadius: 12 },
  dev: { marginTop: spacing.md, fontSize: 12, color: colors.muted },
});
