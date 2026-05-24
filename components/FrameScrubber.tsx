import { useCallback, useMemo, useRef } from 'react';
import { LayoutChangeEvent, PanResponder, Text, View } from 'react-native';
import { useThemedStyles } from '../theme/themedStyles';

type FrameScrubberProps = {
  value: number;
  max: number;
  disabled?: boolean;
  onScrubStart: () => void;
  onScrub: (frame: number) => void;
  onScrubEnd: (frame: number) => void;
};

export function FrameScrubber({
  value,
  max,
  disabled = false,
  onScrubStart,
  onScrub,
  onScrubEnd,
}: FrameScrubberProps) {
  const trackWidthRef = useRef(0);
  const scrubbingRef = useRef(false);

  const styles = useThemedStyles((t) => ({
    wrap: {
      marginBottom: t.spacing.sm,
      opacity: disabled ? 0.5 : 1,
    },
    labelRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: t.spacing.xs,
    },
    label: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      fontWeight: '600' as const,
    },
    touchArea: {
      height: 44,
      justifyContent: 'center' as const,
    },
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: t.colors.border,
      position: 'relative' as const,
      overflow: 'hidden' as const,
    },
    fill: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: 4,
      backgroundColor: t.colors.accentMuted,
    },
    thumb: {
      position: 'absolute' as const,
      top: -6,
      width: 20,
      height: 20,
      borderRadius: 10,
      marginLeft: -10,
      backgroundColor: t.colors.accent,
      borderWidth: 2,
      borderColor: t.colors.surface,
    },
  }));

  const frameFromX = useCallback(
    (x: number) => {
      if (trackWidthRef.current <= 0 || max <= 0) return 0;
      const ratio = Math.max(0, Math.min(x / trackWidthRef.current, 1));
      return Math.round(ratio * max);
    },
    [max],
  );

  const pct = max > 0 ? (value / max) * 100 : 0;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          if (disabled) return;
          scrubbingRef.current = true;
          onScrubStart();
          onScrub(frameFromX(evt.nativeEvent.locationX));
        },
        onPanResponderMove: (evt) => {
          if (disabled || !scrubbingRef.current) return;
          onScrub(frameFromX(evt.nativeEvent.locationX));
        },
        onPanResponderRelease: (evt) => {
          if (disabled || !scrubbingRef.current) return;
          scrubbingRef.current = false;
          onScrubEnd(frameFromX(evt.nativeEvent.locationX));
        },
        onPanResponderTerminate: () => {
          scrubbingRef.current = false;
        },
      }),
    [disabled, frameFromX, onScrub, onScrubEnd, onScrubStart],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Frame scrubber</Text>
        <Text style={styles.label}>
          {value + 1} / {Math.max(max + 1, 1)}
        </Text>
      </View>
      <View style={styles.touchArea} {...pan.panHandlers}>
        <View style={styles.track} onLayout={onLayout}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
          <View style={[styles.thumb, { left: `${pct}%` }]} />
        </View>
      </View>
    </View>
  );
}
