import { LayoutChangeEvent, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { movingWaveSvgPath, type MovingWaveConfig } from '../../lib/calc/reactionStats';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

type MovingTraceCanvasProps = {
  config: MovingWaveConfig;
  canvasWidth: number;
  canvasHeight: number;
  elapsedMs: number;
  durationMs: number;
  isRunning: boolean;
  onTouch: (x: number, y: number) => void;
  onLayout?: (width: number, height: number) => void;
};

export function MovingTraceCanvas({
  config,
  canvasWidth,
  canvasHeight,
  elapsedMs,
  durationMs,
  isRunning,
  onTouch,
  onLayout,
}: MovingTraceCanvasProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((t) => ({
    wrapper: {
      marginVertical: t.spacing.md,
    },
    container: {
      width: '100%' as const,
      height: canvasHeight,
      borderWidth: 2,
      borderColor: t.colors.border,
      borderRadius: t.radii.lg,
      overflow: 'hidden' as const,
      backgroundColor: t.colors.readoutBg,
    },
    help: {
      color: t.colors.muted,
      fontSize: t.typography.caption,
      marginBottom: t.spacing.sm,
    },
    timer: {
      color: t.colors.accent,
      fontWeight: '700' as const,
      marginBottom: t.spacing.sm,
    },
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    onLayout?.(width, height);
  };

  const secsLeft = Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000));
  const drawConfig = { ...config, width: canvasWidth, height: canvasHeight };
  const pathD = movingWaveSvgPath(drawConfig, elapsedMs);

  return (
    <View style={styles.wrapper}>
      {isRunning ? (
        <Text style={styles.timer}>
          Time left: {secsLeft}s — trace the moving wave with your finger
        </Text>
      ) : (
        <Text style={styles.help}>Press Start to begin the 10-second tracing challenge.</Text>
      )}
      <View
        style={styles.container}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => isRunning}
        onMoveShouldSetResponder={() => isRunning}
        onResponderTerminationRequest={() => false}
        onTouchStart={(e) => {
          if (!isRunning) return;
          onTouch(e.nativeEvent.locationX, e.nativeEvent.locationY);
        }}
        onTouchMove={(e) => {
          if (!isRunning) return;
          onTouch(e.nativeEvent.locationX, e.nativeEvent.locationY);
        }}
      >
        <Svg width={canvasWidth} height={canvasHeight} pointerEvents="none">
          <Path
            d={pathD}
            stroke={colors.accent}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </View>
  );
}
