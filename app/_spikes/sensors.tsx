import { Dimensions, ScrollView, StyleSheet, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAccelerometer } from '../../hooks/useAccelerometer';
import { useGyroscope } from '../../hooks/useGyroscope';
import { colors, spacing } from '../../theme/tokens';

const w = Dimensions.get('window').width - spacing.md * 2;

function HzReadout({ label, hz, targetHz }: { label: string; hz: number; targetHz: number }) {
  const delta = Math.abs(hz - targetHz);
  const ok = hz > 0 && delta <= 5;
  return (
    <Text style={styles.t}>
      {label}: {hz.toFixed(1)} Hz (target {targetHz.toFixed(0)} Hz){' '}
      {hz > 0 ? (ok ? '✓' : `Δ${delta.toFixed(1)}`) : '…'}
    </Text>
  );
}

export default function SensorsSpike() {
  const accel = useAccelerometer();
  const gyro = useGyroscope();
  const chartData =
    accel.series.length > 1
      ? accel.series.slice(-60)
      : [0, accel.magnitude, gyro.magnitude, 0.1, 0.2, 0.3];

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h}>Accelerometer</Text>
      <Text style={styles.t}>Magnitude: {accel.magnitude.toFixed(3)}</Text>
      <HzReadout label="Rate" hz={accel.hz} targetHz={accel.targetHz} />
      <Text style={styles.t}>
        5s stats — mean {accel.stats.mean.toFixed(3)}, peak {accel.stats.peak.toFixed(3)}, RMS{' '}
        {accel.stats.rms.toFixed(3)}
      </Text>
      <Text style={styles.t}>Ring samples: {accel.buffer.length}</Text>

      <Text style={[styles.h, { marginTop: spacing.md }]}>Gyroscope</Text>
      <Text style={styles.t}>Magnitude: {gyro.magnitude.toFixed(3)}</Text>
      <HzReadout label="Rate" hz={gyro.hz} targetHz={gyro.targetHz} />
      <Text style={styles.t}>
        5s stats — mean {gyro.stats.mean.toFixed(3)}, peak {gyro.stats.peak.toFixed(3)}, RMS{' '}
        {gyro.stats.rms.toFixed(3)}
      </Text>
      <Text style={styles.t}>Ring samples: {gyro.buffer.length}</Text>

      {__DEV__ ? (
        <Text style={styles.dev}>
          Dev: mount/unmount counts for ocupulse/*-listener labels should stay balanced when you
          leave this screen.
        </Text>
      ) : null}

      <LineChart
        data={{
          labels: ['', '', '', '', '', ''],
          datasets: [{ data: chartData }],
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
  h: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm, color: colors.text },
  t: { fontSize: 16, marginBottom: spacing.sm, color: colors.text },
  dev: { fontSize: 13, color: colors.muted, marginTop: spacing.sm },
});
