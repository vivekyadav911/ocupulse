import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { movementInstruction, type HumanperfMovementId } from '../../lib/humanperf/sessionState';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

type HumanperfMovementDiagramProps = {
  movement: HumanperfMovementId;
  recording?: boolean;
};

function handPosition(movement: HumanperfMovementId, t: number): { x: number; y: number } {
  const phase = t % 1;
  const cx = 120;
  const cy = 140;

  if (movement === 1) {
    const angle = phase * Math.PI * 2;
    return { x: cx + Math.cos(angle) * 40, y: cy - 40 + Math.sin(angle) * 40 };
  }
  if (movement === 2) {
    const y = cy - 60 + Math.sin(phase * Math.PI * 2) * 30;
    return { x: cx, y };
  }
  const x = cx + Math.sin(phase * Math.PI * 2) * 60;
  return { x, y: cy };
}

export function HumanperfMovementDiagram({
  movement,
  recording = false,
}: HumanperfMovementDiagramProps) {
  const { colors } = useAppTheme();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 50);
    return () => clearInterval(id);
  }, []);

  const t = (tick % 60) / 60;
  const hand = handPosition(movement, t);

  const styles = useThemedStyles((theme) => ({
    wrap: {
      marginVertical: theme.spacing.sm,
      alignItems: 'center' as const,
    },
    instruction: {
      fontSize: theme.typography.caption,
      color: theme.colors.muted,
      textAlign: 'center' as const,
      marginTop: theme.spacing.sm,
      lineHeight: 18,
    },
    live: {
      fontSize: theme.typography.caption,
      color: theme.colors.accent,
      fontWeight: '700' as const,
      marginTop: theme.spacing.xs,
    },
  }));

  const arrowPath =
    movement === 1
      ? 'M 120 50 A 45 45 0 1 1 119 50'
      : movement === 2
        ? 'M 165 70 L 165 130 L 155 120 M 165 130 L 175 120 M 165 70 L 155 80 M 165 70 L 175 80'
        : 'M 55 165 L 185 165 L 175 155 M 185 165 L 175 175 M 55 165 L 65 155 M 55 165 L 65 175';

  return (
    <View style={styles.wrap}>
      <Svg width={240} height={200} accessibilityLabel={`Movement ${movement} diagram`}>
        <Line x1={120} y1={160} x2={120} y2={60} stroke={colors.border} strokeWidth={2} />
        <Circle cx={120} cy={50} r={8} fill={colors.muted} />
        <Line x1={120} y1={70} x2={90} y2={110} stroke={colors.text} strokeWidth={3} />
        <Line x1={120} y1={70} x2={150} y2={110} stroke={colors.text} strokeWidth={3} />
        <Line x1={120} y1={110} x2={120} y2={140} stroke={colors.text} strokeWidth={3} />
        <Path
          d={arrowPath}
          stroke={colors.accent}
          strokeWidth={2}
          fill="none"
          strokeDasharray={movement === 1 ? '6 4' : undefined}
        />
        <Circle cx={hand.x} cy={hand.y} r={14} fill={colors.accent} />
        <Line x1={120} y1={110} x2={hand.x} y2={hand.y} stroke={colors.text} strokeWidth={2} />
      </Svg>
      <Text style={styles.instruction}>{movementInstruction(movement)}</Text>
      {recording ? <Text style={styles.live}>Recording — follow the motion</Text> : null}
    </View>
  );
}
