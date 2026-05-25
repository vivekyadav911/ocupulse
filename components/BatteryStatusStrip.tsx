import { Text, View } from 'react-native';
import { useBattery } from '../hooks/useBattery';
import { useThemedStyles } from '../theme/themedStyles';

/** Always-visible battery % and charging state (matches device). */
export function BatteryStatusStrip() {
  const { percent, chargingLabel, available } = useBattery();
  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: t.spacing.md,
      paddingVertical: 6,
      minHeight: 28,
      backgroundColor: t.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    text: { fontSize: t.typography.caption, fontWeight: '600', color: t.colors.muted },
    value: { fontSize: t.typography.caption, fontWeight: '700', color: t.colors.text },
  }));

  const pctLabel = percent != null ? `${percent}%` : available ? '…' : '—';

  return (
    <View style={styles.row}>
      <Text style={styles.text}>Battery</Text>
      <Text style={styles.value}>
        {pctLabel} · {chargingLabel}
      </Text>
    </View>
  );
}
