import { Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { WaveformPoint } from '../../lib/breathing/breathingSignal';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

const CHART_H = 120;
const PAD = { top: 12, right: 8, bottom: 20, left: 8 };

type BreathingWaveformChartProps = {
  samples: WaveformPoint[];
  title?: string;
  height?: number;
  compact?: boolean;
  /** Peak timestamps to mark on the graph (verification). */
  peakTimes?: number[];
};

function pathFromSamples(samples: WaveformPoint[], width: number, height: number): string | null {
  if (samples.length < 2) return null;

  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const tMin = samples[0]!.t;
  const tMax = samples[samples.length - 1]!.t;
  const tSpan = Math.max(1, tMax - tMin);

  let zMin = Infinity;
  let zMax = -Infinity;
  for (const s of samples) {
    zMin = Math.min(zMin, s.z);
    zMax = Math.max(zMax, s.z);
  }
  const zPad = Math.max(0.02, (zMax - zMin) * 0.15);
  zMin -= zPad;
  zMax += zPad;
  const zSpan = Math.max(0.01, zMax - zMin);

  const points = samples.map((s) => {
    const x = PAD.left + ((s.t - tMin) / tSpan) * innerW;
    const y = PAD.top + innerH - ((s.z - zMin) / zSpan) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M ${points.join(' L ')}`;
}

export function BreathingWaveformChart({
  samples,
  title = 'Breathing waveform (last 10 s)',
  height = CHART_H,
  compact = false,
  peakTimes,
}: BreathingWaveformChartProps) {
  const { colors, spacing } = useAppTheme();
  const { width: windowW } = useWindowDimensions();
  const chartWidth = compact ? 120 : Math.max(280, windowW - spacing.md * 4);

  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: compact ? t.typography.caption : t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginBottom: t.spacing.xs,
    },
    empty: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.sm,
    },
  }));

  const path = pathFromSamples(samples, chartWidth, height);

  const peakMarkers =
    path && peakTimes?.length && samples.length >= 2
      ? (() => {
          const innerW = chartWidth - PAD.left - PAD.right;
          const innerH = height - PAD.top - PAD.bottom;
          const tMin = samples[0]!.t;
          const tMax = samples[samples.length - 1]!.t;
          const tSpan = Math.max(1, tMax - tMin);
          let zMin = Infinity;
          let zMax = -Infinity;
          for (const s of samples) {
            zMin = Math.min(zMin, s.z);
            zMax = Math.max(zMax, s.z);
          }
          const zPad = Math.max(0.02, (zMax - zMin) * 0.15);
          zMin -= zPad;
          zMax += zPad;
          const zSpan = Math.max(0.01, zMax - zMin);

          return peakTimes.map((t, i) => {
            let nearest = samples[0]!;
            let bestDist = Math.abs(nearest.t - t);
            for (const s of samples) {
              const d = Math.abs(s.t - t);
              if (d < bestDist) {
                bestDist = d;
                nearest = s;
              }
            }
            const x = PAD.left + ((nearest.t - tMin) / tSpan) * innerW;
            const y = PAD.top + innerH - ((nearest.z - zMin) / zSpan) * innerH;
            return { key: `${t}-${i}`, x, y };
          });
        })()
      : [];

  return (
    <View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {!path ? (
        <Text style={styles.empty}>Waiting for sensor data…</Text>
      ) : (
        <Svg width={chartWidth} height={height}>
          <Rect
            x={PAD.left}
            y={PAD.top}
            width={chartWidth - PAD.left - PAD.right}
            height={height - PAD.top - PAD.bottom}
            fill={colors.readoutBg}
            stroke={colors.border}
            strokeWidth={1}
          />
          <Path d={path} stroke={colors.accent} strokeWidth={compact ? 1.5 : 2} fill="none" />
          {peakMarkers.map((m) => (
            <Circle
              key={m.key}
              cx={m.x}
              cy={m.y}
              r={compact ? 3 : 5}
              fill={colors.danger}
              stroke="#fff"
              strokeWidth={1}
            />
          ))}
        </Svg>
      )}
    </View>
  );
}
