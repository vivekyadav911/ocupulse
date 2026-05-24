import { Text, useWindowDimensions, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { ratingColor } from '../../lib/calc/humanperfJerk';
import {
  MOVEMENTS,
  type HumanperfAttempt,
  type HumanperfMovementId,
} from '../../lib/humanperf/sessionState';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

const CHART_H = 180;
const PAD = { top: 16, right: 12, bottom: 36, left: 36 };

type HumanperfMovementChartProps = {
  attempts: Record<HumanperfMovementId, HumanperfAttempt | null>;
};

export function HumanperfMovementChart({ attempts }: HumanperfMovementChartProps) {
  const { colors, spacing } = useAppTheme();
  const { width: windowW } = useWindowDimensions();
  const chartWidth = Math.max(280, windowW - spacing.md * 4);

  const rows = MOVEMENTS.map((m) => attempts[m.id]).filter((a): a is HumanperfAttempt => a != null);
  const maxJerk = Math.max(5, ...rows.map((r) => r.avgJerkMm));

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
  }));

  if (rows.length === 0) {
    return (
      <View>
        <Text style={styles.title}>Average jerk by movement</Text>
        <Text style={styles.empty}>Record attempts to see the chart.</Text>
      </View>
    );
  }

  const innerW = chartWidth - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;
  const barCount = MOVEMENTS.length;
  const barGap = 12;
  const barWidth = (innerW - barGap * (barCount + 1)) / barCount;

  const yForJerk = (jerk: number) => PAD.top + innerH - (jerk / maxJerk) * innerH;

  return (
    <View>
      <Text style={styles.title}>Average jerk by movement</Text>
      <Svg width={chartWidth} height={CHART_H}>
        {MOVEMENTS.map((m, i) => {
          const attempt = attempts[m.id];
          if (!attempt) return null;
          const x = PAD.left + barGap + i * (barWidth + barGap);
          const yTop = yForJerk(attempt.avgJerkMm);
          const barH = PAD.top + innerH - yTop;
          const fill = ratingColor(attempt.smoothnessRating);
          return (
            <Rect key={m.id} x={x} y={yTop} width={barWidth} height={barH} fill={fill} rx={2} />
          );
        })}
        {MOVEMENTS.map((m, i) => {
          const x = PAD.left + barGap + i * (barWidth + barGap) + barWidth / 2;
          return (
            <SvgText
              key={`label-${m.id}`}
              x={x}
              y={CHART_H - 8}
              fontSize={10}
              fill={colors.muted}
              textAnchor="middle"
            >
              {m.label}
            </SvgText>
          );
        })}
        <SvgText x={8} y={PAD.top + 8} fontSize={10} fill={colors.muted} textAnchor="start">
          {maxJerk.toFixed(0)} mm
        </SvgText>
        <SvgText x={8} y={PAD.top + innerH} fontSize={10} fill={colors.muted} textAnchor="start">
          0
        </SvgText>
      </Svg>
    </View>
  );
}
