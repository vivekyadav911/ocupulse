import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Button } from '../../components/Button';
import { useBatteryLevel } from '../../hooks/useBattery';
import { showAlert } from '../../lib/alert';
import { useAppTheme } from '../../theme/useAppTheme';

async function scheduleIn5s(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
    },
  });
}

function formatTime(ms: number): string {
  if (!ms) return 'never';
  return new Date(ms).toLocaleTimeString();
}

export default function SystemSpike() {
  const { colors, spacing } = useAppTheme();
  const { refresh, percent, updatedAt, available, lowPowerMode } = useBatteryLevel();
  const [perm, setPerm] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [displayPercent, setDisplayPercent] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);

  const applySnapshot = useCallback((percent: number | null, updatedAt: number) => {
    setDisplayPercent(percent);
    setLastUpdated(updatedAt);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh().then((s) => applySnapshot(s.percent, s.updatedAt));
    }, [refresh, applySnapshot]),
  );

  useEffect(() => {
    applySnapshot(percent, updatedAt);
  }, [percent, updatedAt, applySnapshot]);

  useEffect(() => {
    void Notifications.getPermissionsAsync().then((p) => setPerm(p.status));
  }, []);

  const onRefreshBattery = async () => {
    setRefreshing(true);
    try {
      const snap = await refresh();
      applySnapshot(snap.percent, snap.updatedAt);
      const label =
        snap.percent != null
          ? `${snap.percent}% (raw ${(snap.rawLevel * 100).toFixed(1)}%)`
          : 'Unavailable on this device';
      showAlert('Battery updated', `${label}\nRead at ${formatTime(snap.updatedAt)}`);
    } catch (e) {
      showAlert('Refresh failed', e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  };

  const scheduleDefault = async () => {
    try {
      await scheduleIn5s('Ocupulse', 'Test notification (5 s)');
      showAlert('Scheduled', 'Default notification in 5 seconds.');
    } catch (e) {
      showAlert('Failed', e instanceof Error ? e.message : String(e));
    }
  };

  const scheduleCustom = async () => {
    const body = customBody.trim();
    if (!body) {
      showAlert('Enter a message', 'Type your custom notification text first.');
      return;
    }
    try {
      await scheduleIn5s('Ocupulse', body);
      showAlert('Scheduled', `Custom notification in 5 seconds:\n"${body}"`);
    } catch (e) {
      showAlert('Failed', e instanceof Error ? e.message : String(e));
    }
  };

  const batteryLabel =
    displayPercent != null
      ? `${displayPercent}%`
      : available
        ? 'Reading…'
        : 'Unavailable (simulator / web)';

  const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.surfaceAlt },
    content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
    batteryCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    batteryTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
    batteryMeta: { color: colors.muted, fontSize: 13, marginBottom: spacing.md },
    refreshBtn: {
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: colors.primaryButton,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    refreshBtnPressed: { opacity: 0.88 },
    refreshBtnText: { color: colors.textInverse, fontWeight: '700', fontSize: 16 },
    meta: { marginBottom: spacing.lg, color: colors.muted },
    section: {
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      fontWeight: '700',
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: spacing.md,
      minHeight: 88,
      marginBottom: spacing.md,
      color: colors.text,
      backgroundColor: colors.surface,
      textAlignVertical: 'top',
    },
  });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.batteryCard}>
        <Text style={styles.batteryTitle}>Battery: {batteryLabel}</Text>
        <Text style={styles.batteryMeta}>
          Last read: {formatTime(lastUpdated)}
          {lowPowerMode ? ' · Low power mode' : ''}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh battery reading"
          disabled={refreshing}
          onPress={() => void onRefreshBattery()}
          style={({ pressed }) => [styles.refreshBtn, pressed && styles.refreshBtnPressed]}
        >
          {refreshing ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.refreshBtnText}>Refresh battery reading</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.meta}>Notifications: {perm}</Text>

      <Text style={styles.section}>Default test</Text>
      <Button title="Schedule notification in 5s" onPress={() => void scheduleDefault()} />

      <Text style={styles.section}>Custom message (optional)</Text>
      <TextInput
        style={styles.input}
        value={customBody}
        onChangeText={setCustomBody}
        placeholder="Type your notification message…"
        placeholderTextColor={colors.muted}
        multiline
        accessibilityLabel="Custom notification message"
      />
      <Button
        title="Schedule custom notification in 5s"
        variant="accent"
        onPress={() => void scheduleCustom()}
      />
    </ScrollView>
  );
}
