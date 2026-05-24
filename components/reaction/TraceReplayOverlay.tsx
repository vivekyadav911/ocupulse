import { Text, View } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import type { TracePoint } from '../../lib/reaction/sessionState';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

type TraceReplayOverlayProps = {
  width: number;
  height: number;
  idealTrace: TracePoint[];
  waveSnapshots: TracePoint[][];
  tracePath: TracePoint[];
};

function toPolylinePoints(points: TracePoint[]): string {
  if (!points.length) return '';
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

function toSvgPath(points: TracePoint[]): string {
  if (!points.length) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
}

export function TraceReplayOverlay({
  width,
  height,
  idealTrace,
  waveSnapshots,
  tracePath,
}: TraceReplayOverlayProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    container: {
      width: '100%' as const,
      height,
      borderWidth: 2,
      borderColor: t.colors.border,
      borderRadius: t.radii.lg,
      overflow: 'hidden' as const,
      marginVertical: t.spacing.sm,
      backgroundColor: t.colors.readoutBg,
    },
    legend: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.md,
      marginTop: t.spacing.sm,
      marginBottom: t.spacing.md,
    },
    legendItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
    },
    swatch: {
      width: 16,
      height: 4,
      borderRadius: 2,
    },
    legendText: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
    },
  }));

  return (
    <View>
      <Text style={styles.title}>Shape path vs your trace</Text>
      <View style={styles.container}>
        <Svg width={width} height={height}>
          {waveSnapshots.map((snap, i) => (
            <Path
              key={`wave-${i}`}
              d={toSvgPath(snap)}
              stroke={colors.accent}
              strokeWidth={2}
              fill="none"
              opacity={0.3 + (i / Math.max(1, waveSnapshots.length - 1)) * 0.4}
            />
          ))}
          {idealTrace.length > 1 ? (
            <Polyline
              points={toPolylinePoints(idealTrace)}
              stroke={colors.accent}
              strokeWidth={3}
              fill="none"
              strokeDasharray="8 4"
            />
          ) : null}
          {tracePath.length > 1 ? (
            <Polyline
              points={toPolylinePoints(tracePath)}
              stroke="#ff9800"
              strokeWidth={3}
              fill="none"
            />
          ) : null}
        </Svg>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>Shape / ideal path</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: '#ff9800' }]} />
          <Text style={styles.legendText}>Your trace</Text>
        </View>
      </View>
    </View>
  );
}
