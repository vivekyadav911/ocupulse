import { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import {
  angleBetweenVerticalDeg,
  baselineEndpoints,
  lineEndpoints,
} from '../../lib/calc/handfanAngle';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

const LINE_LENGTH_RATIO = 0.75;

type HandFanAngleOverlayProps = {
  angleDeg: number;
  onAngleChange: (deg: number) => void;
  onDragStateChange?: (dragging: boolean) => void;
  disabled?: boolean;
};

export function HandFanAngleOverlay({
  angleDeg,
  onAngleChange,
  onDragStateChange,
  disabled = false,
}: HandFanAngleOverlayProps) {
  const { colors } = useAppTheme();
  const [size, setSize] = useState({ w: 300, h: 280 });
  const draggingRef = useRef(false);

  const styles = useThemedStyles((t) => ({
    overlay: {
      ...StyleSheetAbsoluteFill,
      justifyContent: 'flex-end' as const,
    },
    readout: {
      position: 'absolute' as const,
      top: t.spacing.sm,
      left: t.spacing.sm,
      right: t.spacing.sm,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: t.radii.md,
      padding: t.spacing.sm,
      alignItems: 'center' as const,
    },
    readoutValue: {
      fontSize: t.typography.title,
      fontWeight: '800' as const,
      color: '#fff',
    },
    readoutLabel: {
      fontSize: t.typography.caption,
      color: 'rgba(255,255,255,0.85)',
      marginTop: 2,
    },
    hint: {
      position: 'absolute' as const,
      bottom: t.spacing.sm,
      left: t.spacing.sm,
      right: t.spacing.sm,
      textAlign: 'center' as const,
      fontSize: t.typography.caption,
      color: 'rgba(255,255,255,0.9)',
    },
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ w: width, h: height });
  };

  const origin = useMemo(() => ({ x: size.w / 2, y: size.h - 24 }), [size.w, size.h]);
  const lineLength = size.h * LINE_LENGTH_RATIO;

  const updateAngleFromTouch = useCallback(
    (locationX: number, locationY: number) => {
      const deg = angleBetweenVerticalDeg(locationX, locationY, origin.x, origin.y);
      onAngleChange(deg);
    },
    [onAngleChange, origin.x, origin.y],
  );

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onStartShouldSetPanResponderCapture: () => !disabled,
        onMoveShouldSetPanResponderCapture: () => !disabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          if (disabled) return;
          draggingRef.current = true;
          onDragStateChange?.(true);
          updateAngleFromTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderMove: (evt) => {
          if (disabled || !draggingRef.current) return;
          updateAngleFromTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderRelease: () => {
          draggingRef.current = false;
          onDragStateChange?.(false);
        },
        onPanResponderTerminate: () => {
          draggingRef.current = false;
          onDragStateChange?.(false);
        },
      }),
    [disabled, onDragStateChange, updateAngleFromTouch],
  );

  const baseline = baselineEndpoints(origin, lineLength);
  const dragged = lineEndpoints(origin, lineLength, angleDeg);

  return (
    <View style={styles.overlay} onLayout={onLayout} {...pan.panHandlers}>
      <View style={styles.readout} pointerEvents="none">
        <Text style={styles.readoutValue}>{angleDeg}°</Text>
        <Text style={styles.readoutLabel}>Bend angle</Text>
      </View>
      <Svg width={size.w} height={size.h} pointerEvents="none">
        <Line
          x1={baseline.x1}
          y1={baseline.y1}
          x2={baseline.x2}
          y2={baseline.y2}
          stroke="rgba(255,255,255,0.7)"
          strokeWidth={2}
          strokeDasharray="6,4"
        />
        <Line
          x1={dragged.x1}
          y1={dragged.y1}
          x2={dragged.x2}
          y2={dragged.y2}
          stroke={colors.accent}
          strokeWidth={3}
        />
        <Circle cx={origin.x} cy={origin.y} r={6} fill={colors.accent} />
        <Circle cx={dragged.x2} cy={dragged.y2} r={10} fill={colors.accent} opacity={0.85} />
      </Svg>
      <Text style={styles.hint} pointerEvents="none">
        Drag the line to match the paper bend
      </Text>
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
