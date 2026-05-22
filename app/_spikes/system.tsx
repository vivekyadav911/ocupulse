import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { useBatteryLevel } from '../../hooks/useBattery';
import { colors, spacing } from '../../theme/tokens';

export default function SystemSpike() {
  const bat = useBatteryLevel();
  const [perm, setPerm] = useState('');
  useEffect(() => {
    void Notifications.getPermissionsAsync().then((p) => setPerm(p.status));
  }, []);
  const schedule = async () => {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Ocupulse', body: 'Test notification (5 s)' },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      },
    });
  };
  return (
    <View style={styles.wrap}>
      <Text style={styles.t}>Battery: {Math.round(bat.level * 100)}%</Text>
      <Text>Notifications: {perm}</Text>
      <Button title="Schedule notification in 5s" onPress={schedule} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md },
  t: { marginBottom: spacing.md, color: colors.text },
});
