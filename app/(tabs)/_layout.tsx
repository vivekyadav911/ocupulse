import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useBatteryLevel } from '../../hooks/useBattery';
import { colors, spacing } from '../../theme/tokens';

export default function TabsLayout() {
  const { level } = useBatteryLevel();
  const warn = level < 0.2;
  const critical = level < 0.1;

  return (
    <View style={{ flex: 1 }}>
      {warn ? (
        <View
          style={[styles.banner, { backgroundColor: critical ? colors.danger : colors.accent }]}
        >
          <Text
            style={[styles.bannerText, { color: critical ? colors.textInverse : colors.primary }]}
          >
            {critical ? 'Charge to record — battery critical' : 'Low battery — recordings may stop'}
          </Text>
        </View>
      ) : null}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.surface },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="leaderboard" options={{ title: 'Board' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { padding: spacing.sm },
  bannerText: { fontWeight: '700', textAlign: 'center' },
});
