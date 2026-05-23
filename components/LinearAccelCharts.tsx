import { useEffect, useRef, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import { useAppTheme } from '../theme/useAppTheme';
import { useThemedStyles } from '../theme/themedStyles';

const CHART_POINTS = 72;
const CHART_REDRAW_MS = 1000 / 30;
const CHART_H = 104;
const LEFT_GUTTER = 4;
const VERT_PAD = 8;
/** Minimum half-range (m/s²) so a flat trace at rest still has a visible band. */
const MIN_HALF_SPAN = 0.35;

function cleanSeries(arr: number[]): number[] {
  return arr.map((v) => (Number.isFinite(v) ? v : 0));
}

function yRange(data: number[]): { y0: number; y1: number } {
  const d = cleanSeries(data);
  if (d.length === 0) return { y0: -MIN_HALF_SPAN, y1: MIN_HALF_SPAN };
  let vmin = Math.min(...d);
  let vmax = Math.max(...d);
  const span = vmax - vmin;
  const pad = Math.max(span * 0.12, Math.max(Math.abs(vmin), Math.abs(vmax)) * 0.08, MIN_HALF_SPAN);
  let y0 = vmin - pad;
  let y1 = vmax + pad;
  if (y1 - y0 < 2 * MIN_HALF_SPAN) {
    const mid = (y0 + y1) / 2;
    y0 = mid - MIN_HALF_SPAN;
    y1 = mid + MIN_HALF_SPAN;
  }
  return { y0, y1 };
}

function buildPoints(
  data: number[],
  width: number,
  height: number,
): { points: string; zeroY: number | null } {
  const d = cleanSeries(data);
  const n = d.length;
  const innerW = Math.max(1, width - LEFT_GUTTER);
  const innerH = Math.max(1, height - VERT_PAD * 2);
  const { y0, y1 } = yRange(d);
  const dy = y1 - y0 || 1;

  let zeroY: number | null = null;
  if (y0 <= 0 && y1 >= 0) {
    zeroY = VERT_PAD + innerH - ((0 - y0) / dy) * innerH;
  }

  if (n < 2) {
    const x = LEFT_GUTTER + innerW / 2;
    const v = n === 1 ? d[0]! : 0;
    const y = VERT_PAD + innerH - ((v - y0) / dy) * innerH;
    return { points: `${x},${y} ${x + 0.5},${y}`, zeroY };
  }

  const pts = d
    .map((v, i) => {
      const x = LEFT_GUTTER + (i / (n - 1)) * innerW;
      const y = VERT_PAD + innerH - ((v - y0) / dy) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return { points: pts, zeroY };
}

type AxisSparkProps = {
  data: number[];
  stroke: string;
  label: string;
  latest: number;
  width: number;
  borderColor: string;
  plotBg: string;
};

function AxisSpark({ data, stroke, label, latest, width, borderColor, plotBg }: AxisSparkProps) {
  const innerW = Math.max(80, width);
  const { points, zeroY } = buildPoints(data, innerW, CHART_H);

  return (
    <View accessibilityRole="image" accessibilityLabel={`${label} axis acceleration chart`}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: stroke, marginBottom: 4 }}>
        {label} · {latest.toFixed(3)} m/s²
      </Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: borderColor,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: plotBg,
        }}
      >
        <Svg width={innerW} height={CHART_H}>
          {zeroY != null ? (
            <Line
              x1={LEFT_GUTTER}
              y1={zeroY}
              x2={innerW}
              y2={zeroY}
              stroke={borderColor}
              strokeWidth={1}
              strokeDasharray="4 6"
              opacity={0.7}
            />
          ) : null}
          <Polyline
            points={points}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </View>
  );
}

/** Phyphox-style stacked live linear accel × / y / z (m/s²), rolling window. */
export function LinearAccelCharts({ x, y, z }: { x: number; y: number; z: number }) {
  const { colors, spacing } = useAppTheme();
  const { width: windowW } = useWindowDimensions();

  const chartWidth = Math.max(160, windowW - spacing.md * 4 - spacing.sm - spacing.sm - 8 - 4);

  const styles = useThemedStyles((t) => ({
    heading: {
      marginTop: t.spacing.sm,
      marginBottom: t.spacing.sm,
      fontWeight: '800',
      fontSize: t.typography.caption,
      color: t.colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    help: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.sm,
      lineHeight: 18,
    },
  }));

  const xHist = useRef<number[]>(Array(CHART_POINTS).fill(0));
  const yHist = useRef<number[]>(Array(CHART_POINTS).fill(0));
  const zHist = useRef<number[]>(Array(CHART_POINTS).fill(0));

  const [seriesX, setSeriesX] = useState(() => [...xHist.current]);
  const [seriesY, setSeriesY] = useState(() => [...yHist.current]);
  const [seriesZ, setSeriesZ] = useState(() => [...zHist.current]);

  useEffect(() => {
    const push = (hist: number[], v: number) => [...hist.slice(1), v];
    xHist.current = push(xHist.current, x);
    yHist.current = push(yHist.current, y);
    zHist.current = push(zHist.current, z);
  }, [x, y, z]);

  useEffect(() => {
    const id = setInterval(() => {
      setSeriesX([...xHist.current]);
      setSeriesY([...yHist.current]);
      setSeriesZ([...zHist.current]);
    }, CHART_REDRAW_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <View>
      <Text style={styles.heading}>Linear acceleration (m/s²)</Text>
      <Text style={styles.help}>
        At rest, linear accel is near zero (flat dashed line shows 0). Move the phone to see traces.
      </Text>
      <AxisSpark
        data={seriesX}
        stroke="#2ecc71"
        label="x"
        latest={x}
        width={chartWidth}
        borderColor={colors.border}
        plotBg={colors.readoutBg}
      />
      <View style={{ height: spacing.sm }} />
      <AxisSpark
        data={seriesY}
        stroke="#3498db"
        label="y"
        latest={y}
        width={chartWidth}
        borderColor={colors.border}
        plotBg={colors.readoutBg}
      />
      <View style={{ height: spacing.sm }} />
      <AxisSpark
        data={seriesZ}
        stroke="#f1c40f"
        label="z"
        latest={z}
        width={chartWidth}
        borderColor={colors.border}
        plotBg={colors.readoutBg}
      />
    </View>
  );
}
