import { Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import { useAppTheme } from '../theme/useAppTheme';
import { useThemedStyles } from '../theme/themedStyles';

const CHART_H = 120;
const LEFT_GUTTER = 4;
const VERT_PAD = 8;
const MIN_HALF_SPAN = 5;
const REF_LINES = [60, 85] as const;

function cleanSeries(arr: number[]): number[] {
  return arr.map((v) => (Number.isFinite(v) ? v : 0));
}

function yRange(data: number[]): { y0: number; y1: number } {
  const d = cleanSeries(data);
  if (d.length === 0) return { y0: 30, y1: 40 };
  let vmin = Math.min(...d);
  let vmax = Math.max(...d);
  for (const ref of REF_LINES) {
    vmin = Math.min(vmin, ref);
    vmax = Math.max(vmax, ref);
  }
  const span = vmax - vmin;
  const pad = Math.max(span * 0.12, MIN_HALF_SPAN);
  let y0 = vmin - pad;
  let y1 = vmax + pad;
  if (y1 - y0 < 2 * MIN_HALF_SPAN) {
    const mid = (y0 + y1) / 2;
    y0 = mid - MIN_HALF_SPAN;
    y1 = mid + MIN_HALF_SPAN;
  }
  return { y0, y1 };
}

function valueToY(v: number, y0: number, y1: number, innerH: number): number {
  const dy = y1 - y0 || 1;
  return VERT_PAD + innerH - ((v - y0) / dy) * innerH;
}

function buildPoints(data: number[], width: number, height: number): string {
  const d = cleanSeries(data);
  const n = d.length;
  const innerW = Math.max(1, width - LEFT_GUTTER);
  const innerH = Math.max(1, height - VERT_PAD * 2);
  const { y0, y1 } = yRange(d);

  if (n < 2) {
    const x = LEFT_GUTTER + innerW / 2;
    const v = n === 1 ? d[0]! : y0;
    const y = valueToY(v, y0, y1, innerH);
    return `${x},${y} ${x + 0.5},${y}`;
  }

  return d
    .map((v, i) => {
      const x = LEFT_GUTTER + (i / (n - 1)) * innerW;
      const y = valueToY(v, y0, y1, innerH);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

type SoundLevelChartProps = {
  history: number[];
  liveDb: number | null;
  recording: boolean;
};

/** Phyphox-style rolling sound level trace (approx dB SPL). */
export function SoundLevelChart({ history, liveDb, recording }: SoundLevelChartProps) {
  const { colors, spacing } = useAppTheme();
  const { width: windowW } = useWindowDimensions();
  const chartWidth = Math.max(160, windowW - spacing.md * 4 - spacing.sm - spacing.sm - 8 - 4);

  const styles = useThemedStyles((t) => ({
    heading: {
      marginTop: t.spacing.sm,
      marginBottom: t.spacing.xs,
      fontWeight: '800',
      fontSize: t.typography.caption,
      color: t.colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: t.colors.accent,
      marginBottom: 4,
    },
    help: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.sm,
      lineHeight: 18,
    },
    plot: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: colors.readoutBg,
    },
  }));

  const data = history.length > 0 ? history : [0];
  const innerW = Math.max(80, chartWidth);
  const innerH = Math.max(1, CHART_H - VERT_PAD * 2);
  const { y0, y1 } = yRange(data);
  const points = buildPoints(data, innerW, CHART_H);
  const latestLabel = liveDb != null ? `${liveDb} dB` : recording ? '…' : '—';

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Live sound level chart, approximate decibels"
    >
      <Text style={styles.heading}>Sound level (approx dB)</Text>
      <Text style={styles.help}>
        Dashed lines mark 60 dB (moderate) and 85 dB (loud). Values are phone-relative, not
        calibrated SPL.
      </Text>
      <Text style={styles.label}>Level · {latestLabel}</Text>
      <View style={styles.plot}>
        <Svg width={innerW} height={CHART_H}>
          {REF_LINES.map((ref) => {
            const y = valueToY(ref, y0, y1, innerH);
            return (
              <Line
                key={ref}
                x1={LEFT_GUTTER}
                y1={y}
                x2={innerW}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray="4 6"
                opacity={0.85}
              />
            );
          })}
          <Polyline
            points={points}
            fill="none"
            stroke={colors.accent}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </View>
  );
}
