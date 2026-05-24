import { Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

const CHART_H = 200;
const PAD = { top: 16, right: 16, bottom: 40, left: 48 };

export type ScatterPoint = {
  memberName: string;
  phase1Ms: number;
  phase3AccuracyPct: number;
};

type ReactionScatterPlotProps = {
  points: ScatterPoint[];
};

export function ReactionScatterPlot({ points }: ReactionScatterPlotProps) {
  const { colors, spacing } = useAppTheme();
  const { width: windowW } = useWindowDimensions();
  const chartWidth = Math.max(280, windowW - spacing.md * 4);

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
    axisLabel: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      textAlign: 'center' as const,
      marginTop: t.spacing.xs,
    },
  }));

  if (points.length === 0) {
    return (
      <View>
        <Text style={styles.title}>Reaction time vs tracing accuracy</Text>
        <Text style={styles.empty}>No data to plot yet.</Text>
      </View>
    );
  }

  const innerW = chartWidth - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const xValues = points.map((p) => p.phase1Ms);
  const yValues = points.map((p) => p.phase3AccuracyPct);
  const xMin = Math.min(...xValues) - 20;
  const xMax = Math.max(...xValues) + 20;
  const yMin = Math.max(0, Math.min(...yValues) - 10);
  const yMax = Math.min(100, Math.max(...yValues) + 10);

  const xSpan = Math.max(1, xMax - xMin);
  const ySpan = Math.max(1, yMax - yMin);

  const xFor = (v: number) => PAD.left + ((v - xMin) / xSpan) * innerW;
  const yFor = (v: number) => PAD.top + innerH - ((v - yMin) / ySpan) * innerH;

  return (
    <View>
      <Text style={styles.title}>Reaction time vs tracing accuracy</Text>
      <Svg width={chartWidth} height={CHART_H}>
        <Line
          x1={PAD.left}
          y1={PAD.top + innerH}
          x2={PAD.left + innerW}
          y2={PAD.top + innerH}
          stroke={colors.border}
          strokeWidth={1}
        />
        <Line
          x1={PAD.left}
          y1={PAD.top}
          x2={PAD.left}
          y2={PAD.top + innerH}
          stroke={colors.border}
          strokeWidth={1}
        />
        {points.map((p, i) => (
          <Circle
            key={`${p.memberName}-${i}`}
            cx={xFor(p.phase1Ms)}
            cy={yFor(p.phase3AccuracyPct)}
            r={6}
            fill={colors.accent}
          />
        ))}
        <SvgText
          x={PAD.left + innerW / 2}
          y={CHART_H - 4}
          fontSize={10}
          fill={colors.muted}
          textAnchor="middle"
        >
          Phase 1 reaction (ms)
        </SvgText>
        <SvgText
          x={12}
          y={PAD.top + innerH / 2}
          fontSize={10}
          fill={colors.muted}
          textAnchor="middle"
          rotation={-90}
          origin={`12, ${PAD.top + innerH / 2}`}
        >
          Phase 3 accuracy (%)
        </SvgText>
      </Svg>
    </View>
  );
}
