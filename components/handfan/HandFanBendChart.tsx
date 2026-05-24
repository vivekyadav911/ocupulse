import { Text, useWindowDimensions, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import {
  DESIGNS,
  DISTANCES_CM,
  trialsAsArray,
  type HandfanTrial,
} from '../../lib/handfan/sessionState';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

const CHART_H = 180;
const PAD = { top: 16, right: 12, bottom: 36, left: 36 };

const DISTANCE_COLORS = ['#4A90D9', '#50C878', '#E8A838'] as const;

type HandFanBendChartProps = {
  trials: Record<string, HandfanTrial>;
};

export function HandFanBendChart({ trials }: HandFanBendChartProps) {
  const { colors, spacing } = useAppTheme();
  const { width: windowW } = useWindowDimensions();
  const chartWidth = Math.max(280, windowW - spacing.md * 4);

  const rows = trialsAsArray(trials).filter((t) => t.actualAngleDeg != null);
  const maxAngle = Math.max(10, ...rows.map((t) => t.actualAngleDeg ?? 0));

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
        <Text style={styles.title}>Bend angle chart</Text>
        <Text style={styles.empty}>Record angles to see the chart.</Text>
      </View>
    );
  }

  const innerW = chartWidth - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;
  const groupCount = DESIGNS.length;
  const groupWidth = innerW / groupCount;
  const barCount = DISTANCES_CM.length;
  const barGap = 4;
  const barWidth = (groupWidth - barGap * (barCount + 1)) / barCount;

  const yForAngle = (deg: number) => PAD.top + innerH - (deg / maxAngle) * innerH;

  return (
    <View>
      <Text style={styles.title}>Bend angle chart</Text>
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
        {DESIGNS.map((design, gi) => {
          const groupX = PAD.left + gi * groupWidth;
          return DISTANCES_CM.map((distanceCm, bi) => {
            const trial = trialsAsArray(trials).find(
              (t) => t.design === design && t.distanceCm === distanceCm,
            );
            const angle = trial?.actualAngleDeg;
            if (angle == null) return null;
            const x = groupX + barGap + bi * (barWidth + barGap);
            const yTop = yForAngle(angle);
            const barH = PAD.top + innerH - yTop;
            return (
              <Rect
                key={`${design}-${distanceCm}`}
                x={x}
                y={yTop}
                width={barWidth}
                height={barH}
                fill={DISTANCE_COLORS[bi]}
                rx={2}
              />
            );
          });
        })}
        {DESIGNS.map((design, gi) => {
          const cx = PAD.left + gi * groupWidth + groupWidth / 2;
          return (
            <SvgText
              key={`label-${design}`}
              x={cx}
              y={CHART_H - 8}
              fontSize={11}
              fill={colors.muted}
              textAnchor="middle"
            >
              {`D${design}`}
            </SvgText>
          );
        })}
        <SvgText x={8} y={PAD.top + 8} fontSize={10} fill={colors.muted} textAnchor="start">
          {`${maxAngle}°`}
        </SvgText>
        <SvgText x={8} y={PAD.top + innerH} fontSize={10} fill={colors.muted} textAnchor="start">
          0°
        </SvgText>
      </Svg>
      <View style={styles.legend}>
        {DISTANCES_CM.map((d, i) => (
          <View key={d} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: DISTANCE_COLORS[i] }]} />
            <Text style={styles.legendText}>{d} cm</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
