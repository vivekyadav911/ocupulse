import { Text, useWindowDimensions, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { ratingColor } from '../../lib/calc/earthquakeDisplacement';
import { DESIGNS, runsAsArray, type EarthquakeDesignRun } from '../../lib/earthquake/sessionState';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

const CHART_H = 180;
const PAD = { top: 16, right: 12, bottom: 36, left: 36 };

type EarthquakeDisplacementChartProps = {
  runs: Record<1 | 2 | 3, EarthquakeDesignRun>;
};

export function EarthquakeDisplacementChart({ runs }: EarthquakeDisplacementChartProps) {
  const { colors, spacing } = useAppTheme();
  const { width: windowW } = useWindowDimensions();
  const chartWidth = Math.max(280, windowW - spacing.md * 4);

  const rows = runsAsArray(runs).filter((r) => r.readings != null);
  const peakValues = rows.map((r) => r.readings!.peakDisplacementCm);
  const maxPeak = Math.max(0.5, ...peakValues);

  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
    },
    empty: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.md,
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
    legendSwatch: {
      width: 12,
      height: 12,
      borderRadius: 2,
    },
    legendText: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
    },
  }));

  if (rows.length === 0) {
    return (
      <View>
        <Text style={styles.title}>Displacement comparison</Text>
        <Text style={styles.empty}>Complete design tests to see the chart.</Text>
      </View>
    );
  }

  const innerW = chartWidth - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;
  const barCount = DESIGNS.length;
  const barGap = 12;
  const barWidth = (innerW - barGap * (barCount + 1)) / barCount;
  const yForPeak = (cm: number) => PAD.top + innerH - (cm / maxPeak) * innerH;

  return (
    <View>
      <Text style={styles.title}>Displacement comparison</Text>
      <Svg width={chartWidth} height={CHART_H}>
        <Rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={innerH}
          fill={colors.readoutBg}
          stroke={colors.border}
          strokeWidth={1}
        />
        {DESIGNS.map((design, i) => {
          const run = runs[design];
          const peak = run.readings?.peakDisplacementCm;
          if (peak == null) return null;
          const x = PAD.left + barGap + i * (barWidth + barGap);
          const yTop = yForPeak(peak);
          const barH = PAD.top + innerH - yTop;
          const fill = ratingColor(run.readings!.rating);
          return (
            <Rect key={design} x={x} y={yTop} width={barWidth} height={barH} fill={fill} rx={2} />
          );
        })}
        {DESIGNS.map((design, i) => {
          const cx = PAD.left + barGap + i * (barWidth + barGap) + barWidth / 2;
          return (
            <SvgText
              key={`label-${design}`}
              x={cx}
              y={CHART_H - 8}
              fontSize={11}
              fill={colors.muted}
              textAnchor="middle"
            >
              {`Design ${design}`}
            </SvgText>
          );
        })}
        <SvgText x={8} y={PAD.top + 8} fontSize={10} fill={colors.muted} textAnchor="start">
          {`${maxPeak.toFixed(1)} cm`}
        </SvgText>
        <SvgText x={8} y={PAD.top + innerH} fontSize={10} fill={colors.muted} textAnchor="start">
          0 cm
        </SvgText>
      </Svg>
      <View style={styles.legend}>
        {(['excellent', 'good', 'fair', 'poor'] as const).map((r) => (
          <View key={r} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: ratingColor(r) }]} />
            <Text style={styles.legendText}>
              {r === 'excellent'
                ? 'Excellent (<0.5 cm)'
                : r === 'good'
                  ? 'Good (0.5–1 cm)'
                  : r === 'fair'
                    ? 'Fair (1–2 cm)'
                    : 'Poor (>2 cm)'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
