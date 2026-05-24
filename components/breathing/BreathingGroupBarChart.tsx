import { Text, useWindowDimensions, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { BREATHING_STATES, type BreathingTeamMemberRow } from '../../lib/breathing/sessionState';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

const CHART_H = 200;
const Y_MAX = 60;
const PAD = { top: 16, right: 12, bottom: 44, left: 36 };

const MEMBER_COLORS = ['#4A90D9', '#50C878', '#E8A838', '#E85D75', '#9B59B6', '#1ABC9C'] as const;

type BreathingGroupBarChartProps = {
  rows: BreathingTeamMemberRow[];
};

export function BreathingGroupBarChart({ rows }: BreathingGroupBarChartProps) {
  const { colors, spacing } = useAppTheme();
  const { width: windowW } = useWindowDimensions();
  const chartWidth = Math.max(280, windowW - spacing.md * 4);

  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
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
    },
    legendItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
    },
    legendSwatch: { width: 12, height: 12, borderRadius: 2 },
    legendText: { fontSize: t.typography.caption, color: t.colors.muted },
  }));

  const membersWithData = rows.filter(
    (r) => r.restBpm != null || r.jogBpm != null || r.starJumpsBpm != null,
  );

  if (membersWithData.length === 0) {
    return (
      <View>
        <Text style={styles.title}>BPM by session state</Text>
        <Text style={styles.empty}>Record BPM readings to see the grouped chart.</Text>
      </View>
    );
  }

  const innerW = chartWidth - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;
  const groupCount = BREATHING_STATES.length;
  const groupWidth = innerW / groupCount;
  const memberCount = membersWithData.length;
  const barGap = 4;
  const barWidth = Math.max(4, (groupWidth - barGap * (memberCount + 1)) / memberCount);

  const yForBpm = (bpm: number) => PAD.top + innerH - (Math.min(bpm, Y_MAX) / Y_MAX) * innerH;

  const bpmForState = (row: BreathingTeamMemberRow, stateId: string) => {
    switch (stateId) {
      case 'rest':
        return row.restBpm;
      case 'jog':
        return row.jogBpm;
      case 'starJumps':
        return row.starJumpsBpm;
      default:
        return null;
    }
  };

  return (
    <View>
      <Text style={styles.title}>BPM by session state</Text>
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
        {BREATHING_STATES.map((state, gi) => {
          const groupX = PAD.left + gi * groupWidth;
          return membersWithData.map((member, mi) => {
            const bpm = bpmForState(member, state.id);
            if (bpm == null || bpm <= 0) return null;
            const x = groupX + barGap + mi * (barWidth + barGap);
            const yTop = yForBpm(bpm);
            const barH = PAD.top + innerH - yTop;
            const fill = MEMBER_COLORS[mi % MEMBER_COLORS.length];
            return (
              <Rect
                key={`${state.id}-${member.memberName}`}
                x={x}
                y={yTop}
                width={barWidth}
                height={barH}
                fill={fill}
                rx={2}
              />
            );
          });
        })}
        {BREATHING_STATES.map((state, gi) => {
          const cx = PAD.left + gi * groupWidth + groupWidth / 2;
          return (
            <SvgText
              key={`label-${state.id}`}
              x={cx}
              y={CHART_H - 8}
              fontSize={9}
              fill={colors.muted}
              textAnchor="middle"
            >
              {state.shortLabel}
            </SvgText>
          );
        })}
        <SvgText x={8} y={PAD.top + 8} fontSize={10} fill={colors.muted} textAnchor="start">
          {Y_MAX}
        </SvgText>
        <SvgText x={8} y={PAD.top + innerH} fontSize={10} fill={colors.muted} textAnchor="start">
          0
        </SvgText>
      </Svg>
      <View style={styles.legend}>
        {membersWithData.map((m, i) => (
          <View key={m.memberName} style={styles.legendItem}>
            <View
              style={[
                styles.legendSwatch,
                { backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length] },
              ]}
            />
            <Text style={styles.legendText}>{m.memberName}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
