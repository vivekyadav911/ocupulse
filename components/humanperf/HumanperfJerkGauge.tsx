import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { JERK_DISPLAY_MAX, jerkBarColor } from '../../lib/calc/humanperfJerk';
import { useThemedStyles } from '../../theme/themedStyles';

type HumanperfJerkGaugeProps = {
  liveJerkMm: number;
  peakJerkMm: number | null;
  recording: boolean;
};

function fmtJerk(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(1);
}

export function HumanperfJerkGauge({ liveJerkMm, peakJerkMm, recording }: HumanperfJerkGaugeProps) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const displayJerk = liveJerkMm ?? 0;
  const fillRatio = Math.min(1, Math.max(0, displayJerk / JERK_DISPLAY_MAX));
  const fillColor = jerkBarColor(displayJerk);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: fillRatio,
      duration: 120,
      useNativeDriver: false,
    }).start();
  }, [fillAnim, fillRatio]);

  const styles = useThemedStyles((t) => ({
    wrap: { marginVertical: t.spacing.sm },
    help: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.sm,
      lineHeight: 18,
    },
    readoutRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-end' as const,
      marginBottom: t.spacing.sm,
    },
    liveBlock: { flex: 1 },
    liveLabel: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.muted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
    },
    liveValue: {
      fontSize: 48,
      fontWeight: '800' as const,
      color: t.colors.text,
      lineHeight: 52,
    },
    liveUnit: {
      fontSize: t.typography.body,
      fontWeight: '600' as const,
      color: t.colors.muted,
    },
    peakBlock: { alignItems: 'flex-end' as const },
    peakLabel: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.muted,
    },
    peakValue: {
      fontSize: t.typography.subtitle,
      fontWeight: '800' as const,
      color: t.colors.accent,
    },
    track: {
      height: 28,
      borderRadius: t.radii.md,
      backgroundColor: t.colors.readoutBg,
      borderWidth: 1,
      borderColor: t.colors.border,
      overflow: 'hidden' as const,
    },
    scaleRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginTop: 4,
    },
    scaleText: {
      fontSize: 10,
      color: t.colors.muted,
    },
    status: {
      marginTop: t.spacing.xs,
      fontSize: t.typography.caption,
      color: t.colors.muted,
    },
  }));

  const barWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View accessibilityRole="adjustable" accessibilityLabel="Live jerk meter">
      <Text style={styles.help}>
        Jerk = change in acceleration between samples. Lower jerk means smoother movement.
      </Text>
      <View style={styles.readoutRow}>
        <View style={styles.liveBlock}>
          <Text style={styles.liveLabel}>Live jerk</Text>
          <Text style={styles.liveValue}>
            {fmtJerk(liveJerkMm)}
            <Text style={styles.liveUnit}> mm</Text>
          </Text>
        </View>
        <View style={styles.peakBlock}>
          <Text style={styles.peakLabel}>Attempt peak</Text>
          <Text style={styles.peakValue}>{fmtJerk(peakJerkMm)} mm</Text>
        </View>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={{
            height: '100%',
            width: barWidth,
            backgroundColor: fillColor,
            borderRadius: 8,
          }}
        />
      </View>
      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>0</Text>
        <Text style={styles.scaleText}>5</Text>
        <Text style={styles.scaleText}>15</Text>
        <Text style={styles.scaleText}>30</Text>
        <Text style={styles.scaleText}>50+</Text>
      </View>
      <Text style={styles.status}>
        {recording ? 'Recording at ~100 Hz' : 'Hold phone steady, then start attempt'}
      </Text>
    </View>
  );
}
