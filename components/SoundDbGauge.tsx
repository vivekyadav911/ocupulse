import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { dbBarColor, SPL_DISPLAY_MAX } from '../lib/calc/soundLevel';
import { useThemedStyles } from '../theme/themedStyles';

type SoundDbGaugeProps = {
  liveDb: number | null;
  peakDb: number | null;
  recording: boolean;
};

function fmtDb(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${Math.round(n)}`;
}

export function SoundDbGauge({ liveDb, peakDb, recording }: SoundDbGaugeProps) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const displayDb = liveDb ?? 0;
  const fillRatio = Math.min(1, Math.max(0, displayDb / SPL_DISPLAY_MAX));
  const fillColor = dbBarColor(displayDb);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: fillRatio,
      duration: 200,
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
    <View accessibilityRole="adjustable" accessibilityLabel="Live sound level gauge">
      <Text style={styles.help}>
        Phone-relative approximate dB (0–140 scale). Not calibrated lab equipment.
      </Text>
      <View style={styles.readoutRow}>
        <View style={styles.liveBlock}>
          <Text style={styles.liveLabel}>Current</Text>
          <Text style={styles.liveValue}>
            {fmtDb(liveDb)}
            <Text style={styles.liveUnit}> dB</Text>
          </Text>
        </View>
        <View style={styles.peakBlock}>
          <Text style={styles.peakLabel}>Session peak</Text>
          <Text style={styles.peakValue}>{fmtDb(peakDb)} dB</Text>
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
        <Text style={styles.scaleText}>60</Text>
        <Text style={styles.scaleText}>85</Text>
        <Text style={styles.scaleText}>100</Text>
        <Text style={styles.scaleText}>140</Text>
      </View>
      <Text style={styles.status}>
        {recording ? 'Live metering active' : 'Waiting for microphone…'}
      </Text>
    </View>
  );
}
